from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import uuid
from datetime import datetime
import json
import asyncio
from dotenv import load_dotenv
from supabase import create_client, Client
from google import genai
from google.genai import types
from fpdf import FPDF
import re
import unicodedata

# Local imports
from app.models.research import (
    ResearchRequest, 
    ResearchResponse, 
    ReportSection,
    Source,
    Report,
    ReportResponse,
    ResearchHistory,
    ResearchHistoryResponse
)
from app.routers.auth import get_current_user

# Load environment variables
load_dotenv()

# Initialize supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

router = APIRouter()

# Track active research tasks
active_research_tasks: Dict[str, Any] = {}

# Gemini system prompt for research
SYSTEM_PROMPT = r"""
You are an expert research assistant built by Raihan Khan (raihankhan.dev). Your task is to conduct comprehensive, deep research on the given topic and prepare a detailed, academic-quality report with the following components:

1. Executive Summary: A concise yet comprehensive overview of the topic and key findings (minimum 250 words)
2. Introduction: Thorough background information and context of the topic, including its significance and relevance (minimum 300 words)
3. Main Body: Detailed analysis divided into at least 3-5 relevant sections and subsections, with each section exploring a different aspect of the topic in depth (minimum 500 words per section)
4. Findings & Insights: Comprehensive key discoveries and their implications, including data-driven insights when applicable (minimum 300 words)
5. Conclusion: Thorough summary of the research and potential future directions (minimum 250 words)
6. Sources: Extensive list of all sources used, with URLs, ensuring at least 8-10 high-quality sources

For each fact or claim, include a citation linking to the source. Be thorough in your research, considering multiple perspectives and addressing potential counterarguments. Use clear, precise language and maintain an objective, academic tone throughout the report.

Format your response as a structured JSON object with the following schema:
{
  "summary": "Executive summary text with markdown formatting (do not include 'Executive Summary' as a title within this text)",
  "sections": [
    {
      "title": "Section title",
      "content": "Section content with markdown formatting for headings, lists, emphasis, etc. (do not repeat the section title at the beginning of the content)"
    }
  ],
  "sources": [
    {
      "title": "Source title",
      "url": "Source URL",
      "snippet": "Detailed description of the source with markdown formatting"
    }
  ]
}

IMPORTANT FORMATTING INSTRUCTIONS:
1. Use proper markdown formatting in all text fields:
   - Use # for main headings, ## for subheadings, etc.
   - Use **bold** for emphasis
   - Use *italics* for definitions or special terms
   - Use bullet points (- item) and numbered lists (1. item) where appropriate
   - Use > for quotes or important callouts
   - Use markdown tables for structured data with | and - characters

2. DO NOT include the field name as a heading in the content:
   - In the "summary" field, do not start with "Executive Summary:" or "# Executive Summary"
   - In each section's "content" field, do not repeat the section title at the beginning

CRITICAL JSON FORMATTING REQUIREMENTS:
1. Your response MUST be valid JSON that can be parsed by Python's json.loads() function
2. Properly escape all special characters in JSON strings:
   - Use \\\\ for backslashes
   - Use \\" for quotes within strings
   - Use \\n for newlines
   - Avoid using single backslashes (\\) before any character except the ones listed above
3. Do NOT include any text, markdown formatting, or code blocks outside the JSON structure
4. The entire response should be a single, valid JSON object

This format will be used to generate a downloadable PDF report, so ensure your content is well-structured, comprehensive, and professionally formatted.

IMPORTANT: Return ONLY valid JSON without any additional text or code block markers. The content inside the JSON should use markdown formatting, but the JSON itself must be valid and parseable.
"""

async def conduct_research(research_id: str, topic: str, additional_context: Optional[str], user_id: int):
    """Background task to conduct research using Gemini API"""
    try:
        # Update the status to processing
        active_research_tasks[research_id]["status"] = "processing"
        
        # Prepare the prompt
        prompt = f"Topic: {topic}"
        if additional_context:
            prompt += f"\nAdditional context: {additional_context}"
        
        prompt += "\n\nIMPORTANT: Your response MUST be a valid JSON object without any markdown formatting or code blocks. The JSON must be directly parseable by Python's json.loads() function. Properly escape all special characters in strings."
        
        # Using the exact code provided
        client = genai.Client(
            api_key=os.environ.get("GEMINI_API_KEY"),
        )

        model = "gemini-2.0-pro-exp-02-05"
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(
                        text=SYSTEM_PROMPT + "\n\n" + prompt
                    ),
                ],
            ),
        ]
        tools = [
            types.Tool(google_search=types.GoogleSearch())
        ]
        generate_content_config = types.GenerateContentConfig(
            temperature=1,
            top_p=0.95,
            top_k=64,
            max_output_tokens=8192,
            tools=tools,
            response_mime_type="text/plain",
        )
        
        # Collect the response
        full_response = ""
        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
        ):
            if chunk.text:
                full_response += chunk.text
        
        print(f"Raw response preview: {full_response[:200]}...")  # Print first 200 chars for debugging
        
        # Parse JSON from the response using our improved approach
        def parse_json(text):
            # Try to parse as clean JSON first
            try:
                result = json.loads(text.strip())
                print("Successfully parsed JSON from raw text")
                return True, result
            except json.JSONDecodeError as e:
                print(f"JSON parsing error: {e}")
                
                # Check if the response is wrapped in a code block
                code_block_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
                if code_block_match:
                    json_str = code_block_match.group(1).strip()
                    try:
                        result = json.loads(json_str)
                        print("Successfully parsed JSON from code block")
                        return True, result
                    except json.JSONDecodeError as e:
                        print(f"JSON parsing error in code block: {e}")
                        
                        # Try to fix invalid escape sequences
                        try:
                            # Replace problematic escape sequences
                            fixed_json_str = re.sub(r'\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})', r'\\\\', json_str)
                            result = json.loads(fixed_json_str)
                            print("Successfully parsed JSON from code block after fixing escape sequences")
                            return True, result
                        except json.JSONDecodeError as e2:
                            print(f"Still failed after fixing escapes in code block: {e2}")
                
                # Try to extract JSON between curly braces
                try:
                    # Find the first { and the last }
                    start_idx = text.find('{')
                    end_idx = text.rfind('}')
                    
                    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                        json_str = text[start_idx:end_idx+1]
                        
                        # Try with original string
                        try:
                            result = json.loads(json_str)
                            print("Successfully extracted JSON between curly braces")
                            return True, result
                        except json.JSONDecodeError as e:
                            # Try to fix invalid escape sequences
                            try:
                                # Replace problematic escape sequences
                                fixed_json_str = re.sub(r'\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})', r'\\\\', json_str)
                                result = json.loads(fixed_json_str)
                                print("Successfully extracted JSON after fixing escape sequences")
                                return True, result
                            except json.JSONDecodeError as e2:
                                print(f"Still failed after fixing escapes: {e2}")
                except Exception as e:
                    print(f"JSON extraction error: {e}")
                
                # Last resort: try to manually fix common issues in the entire text
                try:
                    # Replace problematic escape sequences in the entire text
                    fixed_text = re.sub(r'\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})', r'\\\\', text)
                    
                    # Try to find JSON in the fixed text
                    start_idx = fixed_text.find('{')
                    end_idx = fixed_text.rfind('}')
                    
                    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                        fixed_json_str = fixed_text[start_idx:end_idx+1]
                        result = json.loads(fixed_json_str)
                        print("Successfully parsed JSON after comprehensive fixing")
                        return True, result
                except Exception as e:
                    print(f"Comprehensive fixing failed: {e}")
                
                return False, None
        
        success, result = parse_json(full_response)
        
        if not success:
            # If all parsing attempts fail, create a basic structure
            print("Failed to parse JSON from response. Creating fallback structure.")
            result = {
                "summary": "Error: Could not parse research results",
                "sections": [
                    {
                        "title": "Error",
                        "content": "There was an error processing the research results. Please try again."
                    },
                    {
                        "title": "Raw Response",
                        "content": full_response[:1000] + ("..." if len(full_response) > 1000 else "")
                    }
                ],
                "sources": []
            }
        
        # Create a report object
        report = {
            "id": research_id,
            "user_id": user_id,
            "topic": topic,
            "summary": result.get("summary", ""),
            "sections": result.get("sections", []),
            "sources": result.get("sources", []),
            "created_at": datetime.utcnow().isoformat(),
            "report_json": json.dumps(result)
        }
        
        # Save to Supabase
        supabase.table("research_reports").insert(report).execute()
        
        # Update the status
        active_research_tasks[research_id]["status"] = "completed"
        
    except Exception as e:
        # Handle errors
        active_research_tasks[research_id]["status"] = "failed"
        active_research_tasks[research_id]["error"] = str(e)
        print(f"Research error: {e}")

@router.post("/", response_model=ResearchResponse)
async def request_research(
    research_req: ResearchRequest, 
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Start a research task on a topic"""
    # Generate a unique ID for this research
    research_id = str(uuid.uuid4())
    
    # Initialize the task status
    active_research_tasks[research_id] = {
        "user_id": current_user["id"],
        "topic": research_req.topic,
        "status": "in_progress",
        "start_time": datetime.utcnow().isoformat()
    }
    
    # Start the research task in the background
    background_tasks.add_task(
        conduct_research, 
        research_id, 
        research_req.topic, 
        research_req.additional_context,
        current_user["id"]
    )
    
    return ResearchResponse(
        research_id=research_id,
        status="in_progress",
        estimated_time=60  # Estimate 60 seconds for research
    )

@router.get("/history", response_model=ResearchHistoryResponse)
async def get_research_history(current_user: dict = Depends(get_current_user)):
    """Get the user's research history"""
    response = supabase.table("research_reports")\
        .select("id, user_id, topic, created_at")\
        .eq("user_id", current_user["id"])\
        .order("created_at", desc=True)\
        .execute()
    
    researches = [
        ResearchHistory(
            id=item["id"],
            user_id=item["user_id"],
            topic=item["topic"],
            created_at=item["created_at"]
        )
        for item in response.data
    ]
    
    return ResearchHistoryResponse(researches=researches)

@router.get("/{research_id}/status")
async def get_research_status(research_id: str, current_user: dict = Depends(get_current_user)):
    """Get the status of a research task"""
    if research_id not in active_research_tasks:
        # Check if it's in the database
        response = supabase.table("research_reports")\
            .select("*")\
            .eq("id", research_id)\
            .eq("user_id", current_user["id"])\
            .execute()
        
        if response.data:
            return {"status": "completed"}
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research task not found"
        )
    
    task = active_research_tasks[research_id]
    
    # Ensure the user owns this research
    if task["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return {"status": task["status"]}

@router.get("/{research_id}", response_model=ReportResponse)
async def get_research_report(research_id: str, current_user: dict = Depends(get_current_user)):
    """Get the completed research report"""
    # Check if the research is completed
    if research_id in active_research_tasks and active_research_tasks[research_id]["status"] != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Research is still in progress"
        )
    
    # Get from database
    response = supabase.table("research_reports")\
        .select("*")\
        .eq("id", research_id)\
        .eq("user_id", current_user["id"])\
        .execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research report not found"
        )
    
    report_data = response.data[0]
    
    # Parse the JSON fields
    try:
        if isinstance(report_data["sections"], str):
            report_data["sections"] = json.loads(report_data["sections"])
        if isinstance(report_data["sources"], str):
            report_data["sources"] = json.loads(report_data["sources"])
    except:
        # If parsing fails, use the raw data
        pass
    
    return ReportResponse(
        id=report_data["id"],
        topic=report_data["topic"],
        summary=report_data["summary"],
        sections=report_data["sections"],
        sources=report_data["sources"],
        created_at=report_data["created_at"]
    )

@router.get("/{research_id}/pdf")
async def get_research_pdf(research_id: str, current_user: dict = Depends(get_current_user)):
    """Generate and download a PDF of the research report using ReportLab"""
    pdf_path = None
    try:
        # Get the report
        response = supabase.table("research_reports")\
            .select("*")\
            .eq("id", research_id)\
            .eq("user_id", current_user["id"])\
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Research report not found"
            )
        
        report_data = response.data[0]
        
        # Parse the JSON fields
        if isinstance(report_data["sections"], str):
            report_data["sections"] = json.loads(report_data["sections"])
        if isinstance(report_data["sources"], str):
            report_data["sources"] = json.loads(report_data["sources"])
        
        # Create a unique temporary file path
        pdf_path = f"temp_{research_id}_{uuid.uuid4().hex[:8]}.pdf"
        
        # Simple sanitize function - strip problematic characters
        def simple_sanitize(text):
            if text is None:
                return ""
            # Convert to string
            return str(text).encode('ascii', 'replace').decode('ascii')
        
        # Import ReportLab components
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
        from reportlab.lib.units import inch
        
        # Create the document with generous margins
        doc = SimpleDocTemplate(
            pdf_path,
            pagesize=letter,
            rightMargin=0.85*inch,
            leftMargin=0.85*inch,
            topMargin=0.85*inch,
            bottomMargin=0.85*inch
        )
        
        # Create styles
        styles = getSampleStyleSheet()
        
        # Custom styles for better design
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Title'],
            fontSize=20,
            spaceAfter=24,
            alignment=1,  # Center alignment
            textColor=colors.darkblue
        )
        
        heading1_style = ParagraphStyle(
            'CustomHeading1',
            parent=styles['Heading1'],
            fontSize=16,
            spaceBefore=16,
            spaceAfter=10,
            textColor=colors.darkblue,
            borderWidth=0,
            borderColor=colors.lightgrey,
            borderPadding=5,
            borderRadius=3
        )
        
        heading2_style = ParagraphStyle(
            'CustomHeading2',
            parent=styles['Heading2'],
            fontSize=14,
            spaceBefore=14,
            spaceAfter=8,
            textColor=colors.darkblue
        )
        
        heading3_style = ParagraphStyle(
            'CustomHeading3',
            parent=styles['Heading3'],
            fontSize=12,
            spaceBefore=12,
            spaceAfter=6,
            textColor=colors.darkblue
        )
        
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=11,
            spaceBefore=6,
            spaceAfter=8,
            leading=16  # Increased line spacing
        )
        
        # Create a custom style for list items
        list_style = ParagraphStyle(
            'ListItem',
            parent=normal_style,
            leftIndent=30,
            firstLineIndent=0,
            spaceBefore=3,
            spaceAfter=3,
            bulletIndent=15,
            bulletFontName='Helvetica',
            bulletFontSize=11,
            leading=16
        )
        
        # Create a custom style for sources
        source_style = ParagraphStyle(
            'Source',
            parent=normal_style,
            fontSize=10,
            spaceBefore=4,
            spaceAfter=6,
            leading=14
        )
        
        # Create a custom style for URLs
        url_style = ParagraphStyle(
            'URL',
            parent=normal_style,
            textColor=colors.blue,
            fontSize=9,
            spaceBefore=2,
            spaceAfter=6
        )
        
        # Function to process markdown text
        def process_markdown(text, is_list_item=False):
            if not text:
                return text
                
            # Process bold: **text** or __text__
            text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
            text = re.sub(r'__(.*?)__', r'<b>\1</b>', text)
            
            # Process italic: *text* or _text_
            text = re.sub(r'\*([^*]+)\*', r'<i>\1</i>', text)
            text = re.sub(r'_([^_]+)_', r'<i>\1</i>', text)
            
            # Process links: [text](url)
            text = re.sub(r'\[(.*?)\]\((.*?)\)', r'<link href="\2">\1</link>', text)
            
            # Process inline code: `code`
            text = re.sub(r'`(.*?)`', r'<code>\1</code>', text)
            
            # Process superscript: ^text^
            text = re.sub(r'\^(.*?)\^', r'<super>\1</super>', text)
            
            # Process subscript: ~text~
            text = re.sub(r'~(.*?)~', r'<sub>\1</sub>', text)
            
            # Process strikethrough: ~~text~~
            text = re.sub(r'~~(.*?)~~', r'<strike>\1</strike>', text)
            
            return text
        
        # Build the document content
        content = []
        
        # Add a spacer at the top for better layout
        content.append(Spacer(1, 0.2*inch))
        
        # Title
        topic = simple_sanitize(report_data.get('topic', 'Research Report'))
        content.append(Paragraph(topic, title_style))
        
        # Date line
        from datetime import datetime
        date_style = ParagraphStyle('DateStyle', parent=normal_style, alignment=2, fontSize=9, textColor=colors.gray)
        date_text = f"Generated on: {datetime.now().strftime('%B %d, %Y')}"
        content.append(Paragraph(date_text, date_style))
        content.append(Spacer(1, 0.3*inch))
        
        # Add a horizontal line
        content.append(HRFlowable(
            width="100%", 
            thickness=1, 
            lineCap='round', 
            color=colors.lightgrey, 
            spaceBefore=0.1*inch, 
            spaceAfter=0.3*inch
        ))
        
        # Executive Summary - don't repeat "Executive Summary" title
        summary = simple_sanitize(report_data.get("summary", "No summary available"))
        
        # Process paragraphs
        paragraphs = summary.split('\n\n')
        
        for para in paragraphs:
            if not para.strip():
                continue
                
            # Check if it's a list item
            if para.startswith('- ') or para.startswith('* '):
                lines = para.split('\n')
                for line in lines:
                    if not line.strip():
                        continue
                        
                    if line.startswith('- ') or line.startswith('* '):
                        processed_text = process_markdown(line[2:], True)
                        content.append(Paragraph("• " + processed_text, list_style))
                    else:
                        processed_text = process_markdown(line)
                        content.append(Paragraph(processed_text, normal_style))
            else:
                processed_text = process_markdown(para)
                content.append(Paragraph(processed_text, normal_style))
        
        # Add a horizontal line before sections
        content.append(Spacer(1, 0.2*inch))
        
        # Sections
        for section in report_data.get("sections", []):
            content.append(PageBreak())
            
            # Add some space at the top of each page
            content.append(Spacer(1, 0.1*inch))
            
            # Section title with background
            title = simple_sanitize(section.get("title", "Untitled Section"))
            
            # Create a styled heading with background
            section_title_style = ParagraphStyle(
                'SectionTitle',
                parent=heading1_style,
                backColor=colors.lightgrey.clone(alpha=0.3),
                borderPadding=8,
                borderWidth=0,
                borderRadius=4
            )
            content.append(Paragraph(title, section_title_style))
            content.append(Spacer(1, 0.2*inch))
            
            # Process section content
            section_content = simple_sanitize(section.get("content", "No content available"))
            
            # Split by paragraphs
            paragraphs = section_content.split('\n\n')
            
            for para in paragraphs:
                if not para.strip():
                    continue
                
                # Check if it's a heading
                if para.startswith('# '):
                    heading_text = process_markdown(para[2:])
                    h1_style = ParagraphStyle(
                        'InlineH1',
                        parent=heading1_style,
                        spaceBefore=16
                    )
                    content.append(Paragraph(heading_text, h1_style))
                    content.append(Spacer(1, 0.1*inch))
                elif para.startswith('## '):
                    heading_text = process_markdown(para[3:])
                    h2_style = ParagraphStyle(
                        'InlineH2',
                        parent=heading2_style,
                        spaceBefore=14
                    )
                    content.append(Paragraph(heading_text, h2_style))
                    content.append(Spacer(1, 0.05*inch))
                elif para.startswith('### '):
                    heading_text = process_markdown(para[4:])
                    h3_style = ParagraphStyle(
                        'InlineH3',
                        parent=heading3_style,
                        spaceBefore=12
                    )
                    content.append(Paragraph(heading_text, h3_style))
                    content.append(Spacer(1, 0.05*inch))
                # Check if it's a list
                elif para.startswith('- ') or para.startswith('* '):
                    lines = para.split('\n')
                    for line in lines:
                        if not line.strip():
                            continue
                            
                        if line.startswith('- ') or line.startswith('* '):
                            processed_text = process_markdown(line[2:], True)
                            content.append(Paragraph("• " + processed_text, list_style))
                        else:
                            processed_text = process_markdown(line)
                            content.append(Paragraph(processed_text, normal_style))
                    # Add a small space after list
                    content.append(Spacer(1, 0.05*inch))
                # Check if it's a numbered list
                elif re.match(r'^\d+\.', para):
                    lines = para.split('\n')
                    for line in lines:
                        if not line.strip():
                            continue
                            
                        match = re.match(r'^(\d+)\.', line)
                        if match:
                            num = match.group(1)
                            rest = line[len(num)+1:].strip()
                            processed_text = process_markdown(rest, True)
                            
                            # Create a custom bullet style with the number
                            num_style = ParagraphStyle(
                                f'NumberedList{num}',
                                parent=list_style,
                                bulletText=f"{num}."
                            )
                            content.append(Paragraph(processed_text, num_style))
                        else:
                            processed_text = process_markdown(line)
                            content.append(Paragraph(processed_text, normal_style))
                    # Add a small space after list
                    content.append(Spacer(1, 0.05*inch))
                # Check if it's a blockquote
                elif para.startswith('>'):
                    blockquote_text = '\n'.join([line[1:].strip() if line.startswith('>') else line for line in para.split('\n')])
                    blockquote_style = ParagraphStyle(
                        'Blockquote',
                        parent=normal_style,
                        leftIndent=40,
                        rightIndent=40,
                        fontName='Helvetica-Oblique',
                        textColor=colors.darkslategray,
                        borderWidth=0,
                        borderColor=colors.lightgrey,
                        borderPadding=10,
                        borderRadius=4,
                        backColor=colors.lightgrey.clone(alpha=0.2)
                    )
                    processed_text = process_markdown(blockquote_text)
                    content.append(Paragraph(processed_text, blockquote_style))
                    content.append(Spacer(1, 0.1*inch))
                # Check if it might be a table (contains | character)
                elif '|' in para and ('---' in para or '-+-' in para):
                    # Simple table detection and processing
                    try:
                        rows = [row.strip() for row in para.split('\n') if row.strip()]
                        if len(rows) >= 3 and all('|' in row for row in rows):
                            # Skip separator row
                            header_row = [cell.strip() for cell in rows[0].split('|') if cell.strip()]
                            data_rows = []
                            
                            for row in rows[2:]:  # Skip header and separator
                                cells = [cell.strip() for cell in row.split('|') if cell.strip()]
                                if cells:
                                    data_rows.append(cells)
                            
                            # Create table data including header
                            table_data = [header_row]
                            table_data.extend(data_rows)
                            
                            # Create table style
                            table_style = TableStyle([
                                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                                ('TEXTCOLOR', (0, 0), (-1, 0), colors.darkblue),
                                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                                ('FONTSIZE', (0, 0), (-1, 0), 10),
                                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                                ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                                ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
                                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                                ('FONTSIZE', (0, 1), (-1, -1), 9),
                                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.whitesmoke])
                            ])
                            
                            # Create the table
                            table = Table(table_data)
                            table.setStyle(table_style)
                            content.append(Spacer(1, 0.1*inch))
                            content.append(table)
                            content.append(Spacer(1, 0.2*inch))
                            continue
                    except Exception as e:
                        # If table processing fails, fall back to normal paragraph
                        print(f"Table processing failed: {str(e)}")
                
                # Regular paragraph
                else:
                    processed_text = process_markdown(para)
                    content.append(Paragraph(processed_text, normal_style))
        
        # Sources
        content.append(PageBreak())
        
        # Add some space at the top
        content.append(Spacer(1, 0.1*inch))
        
        # Sources title with background
        sources_title_style = ParagraphStyle(
            'SourcesTitle',
            parent=heading1_style,
            backColor=colors.lightgrey.clone(alpha=0.3),
            borderPadding=8,
            borderWidth=0,
            borderRadius=4
        )
        content.append(Paragraph("Sources", sources_title_style))
        content.append(Spacer(1, 0.2*inch))
        
        sources = report_data.get("sources", [])
        if not sources:
            content.append(Paragraph("No sources available", normal_style))
        else:
            # Create a more visually appealing sources section
            for i, source in enumerate(sources):
                # Source container with light background
                title = simple_sanitize(source.get('title', f"Source {i+1}"))
                
                # Source box style
                source_box_style = ParagraphStyle(
                    'SourceBox',
                    parent=heading2_style,
                    fontSize=12,
                    spaceBefore=12,
                    spaceAfter=4,
                    backColor=colors.lightgrey.clone(alpha=0.15),
                    borderPadding=8,
                    borderWidth=0,
                    borderRadius=4
                )
                
                # Source title with number
                content.append(Paragraph(f"{i+1}. {title}", source_box_style))
                
                # URL with link styling
                url = simple_sanitize(source.get('url', 'No URL provided'))
                # Truncate very long URLs
                if len(url) > 80:
                    url = url[:77] + "..."
                
                url_display = f"URL: <link href='{url}'>{url}</link>"
                content.append(Paragraph(url_display, url_style))
                
                # Snippet with proper formatting
                if source.get("snippet"):
                    snippet = simple_sanitize(source.get('snippet', ''))
                    # Truncate very long snippets
                    if len(snippet) > 300:
                        snippet = snippet[:297] + "..."
                    content.append(Paragraph(f"<i>Description:</i> {snippet}", source_style))
                
                # Add some space between sources
                content.append(Spacer(1, 0.2*inch))
        
        # Footer function
        def add_footer(canvas, doc):
            canvas.saveState()
            # Add a light gray line
            canvas.setStrokeColor(colors.lightgrey)
            canvas.line(doc.leftMargin, 0.5*inch, doc.width + doc.leftMargin, 0.5*inch)
            
            # Add footer text
            canvas.setFont('Helvetica-Oblique', 8)
            canvas.setFillColor(colors.grey)
            footer_text = "Generated by DeepR - raihankhan.dev"
            canvas.drawCentredString(doc.width/2 + doc.leftMargin, 0.35*inch, footer_text)
            
            # Add page number
            canvas.setFont('Helvetica', 8)
            canvas.drawRightString(doc.width + doc.leftMargin, 0.35*inch, f"Page {doc.page}")
            canvas.restoreState()
        
        # Build the PDF
        doc.build(content, onFirstPage=add_footer, onLaterPages=add_footer)
        
        # Create a background task to clean up the file after it's been sent
        background_tasks = BackgroundTasks()
        background_tasks.add_task(cleanup_temp_file, pdf_path)
        
        # Return the file as a response
        return FileResponse(
            path=pdf_path, 
            filename=f"DeepR_Research_{topic.replace(' ', '_')}.pdf",
            media_type="application/pdf",
            background=background_tasks
        )
    except Exception as e:
        # Clean up any temporary file if it exists
        if pdf_path and os.path.exists(pdf_path):
            try:
                os.remove(pdf_path)
            except:
                pass
                
        # Log the error and return a proper HTTP exception
        error_detail = f"Failed to generate PDF: {str(e)}"
        print(error_detail)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_detail
        )

# Helper function to clean up temporary files
def cleanup_temp_file(file_path: str):
    """Remove a temporary file after it's been sent to the client"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Cleaned up temporary file: {file_path}")
    except Exception as e:
        print(f"Error cleaning up temporary file {file_path}: {str(e)}") 