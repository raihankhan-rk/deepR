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
SYSTEM_PROMPT = """
You are an expert research assistant built by Raihan Khan (raihankhan.dev). Your task is to conduct comprehensive, deep research on the given topic and prepare a detailed report with the following components:

1. Executive Summary: A concise overview of the topic and key findings
2. Introduction: Background information and context of the topic
3. Main Body: Detailed analysis divided into relevant sections and subsections
4. Findings & Insights: Key discoveries and their implications
5. Conclusion: Summary of the research and potential future directions
6. Sources: List of all sources used, with URLs

For each fact or claim, include a citation linking to the source. Be thorough in your research, considering multiple perspectives and addressing potential counterarguments. Use clear, precise language and maintain an objective tone throughout the report.

Format your response as a structured JSON object with the following schema:
{
  "summary": "Executive summary text",
  "sections": [
    {
      "title": "Section title",
      "content": "Section content"
    }
  ],
  "sources": [
    {
      "title": "Source title",
      "url": "Source URL",
      "snippet": "Brief description of the source"
    }
  ]
}

This format will be used to generate a downloadable PDF report, so ensure your content is well-structured and comprehensive.
IMPORTANT: Return ONLY valid JSON without any additional text, markdown formatting, or code block markers.
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
                        text=SYSTEM_PROMPT + "\n\nYour response must be a valid JSON object without any markdown formatting or code blocks. The response should be parseable by Python's json.loads() function.\n\n" + prompt
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
                
                # Try to extract JSON between curly braces
                try:
                    # Find the first { and the last }
                    start_idx = text.find('{')
                    end_idx = text.rfind('}')
                    
                    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                        json_str = text[start_idx:end_idx+1]
                        result = json.loads(json_str)
                        print("Successfully extracted JSON between curly braces")
                        return True, result
                except json.JSONDecodeError as e:
                    print(f"JSON extraction error: {e}")
                
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
    """Generate and download a PDF of the research report"""
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
    
    # Create a PDF
    pdf = FPDF()
    pdf.add_page()
    
    # Set up fonts
    pdf.set_font("Arial", "B", 16)
    
    # Title
    pdf.cell(0, 10, f"Research Report: {report_data['topic']}", 0, 1, "C")
    pdf.ln(10)
    
    # Summary
    pdf.set_font("Arial", "B", 14)
    pdf.cell(0, 10, "Executive Summary", 0, 1)
    pdf.set_font("Arial", "", 12)
    pdf.multi_cell(0, 10, report_data["summary"])
    pdf.ln(10)
    
    # Sections
    for section in report_data["sections"]:
        pdf.set_font("Arial", "B", 14)
        pdf.cell(0, 10, section["title"], 0, 1)
        pdf.set_font("Arial", "", 12)
        pdf.multi_cell(0, 10, section["content"])
        pdf.ln(5)
    
    # Sources
    pdf.add_page()
    pdf.set_font("Arial", "B", 14)
    pdf.cell(0, 10, "Sources", 0, 1)
    
    for i, source in enumerate(report_data["sources"]):
        pdf.set_font("Arial", "B", 12)
        pdf.cell(0, 10, f"{i+1}. {source['title']}", 0, 1)
        pdf.set_font("Arial", "", 10)
        pdf.cell(0, 10, f"URL: {source['url']}", 0, 1)
        if "snippet" in source and source["snippet"]:
            pdf.multi_cell(0, 10, f"Description: {source['snippet']}")
        pdf.ln(5)
    
    # Save the PDF to a temporary file
    pdf_path = f"temp_{research_id}.pdf"
    pdf.output(pdf_path)
    
    # Return the file as a response
    return FileResponse(
        path=pdf_path, 
        filename=f"Research_Report_{report_data['topic'].replace(' ', '_')}.pdf",
        media_type="application/pdf",
        background=BackgroundTasks()
    ) 