import os
import asyncio
from dotenv import load_dotenv
import uuid
import json
import copy

# Load environment variables
load_dotenv()

async def test_research_without_db_save():
    # Import here to avoid circular imports
    from app.routers.research import active_research_tasks
    
    # Generate a random research ID
    research_id = str(uuid.uuid4())
    
    # Mock active_research_tasks entry
    active_research_tasks[research_id] = {"status": "pending"}
    
    # Test topic
    topic = "The impact of artificial intelligence on healthcare"
    
    # Mock user ID
    user_id = 1
    
    print(f"Starting research on: {topic}")
    print(f"Research ID: {research_id}")
    
    try:
        # Import the necessary modules
        from google import genai
        from google.genai import types
        from app.routers.research import SYSTEM_PROMPT
        
        # Update the status to processing
        active_research_tasks[research_id]["status"] = "processing"
        
        # Prepare the prompt
        prompt = f"Topic: {topic}"
        
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
                        text=SYSTEM_PROMPT + "\n\nPlease format your response as valid JSON with the following structure: {\"summary\": \"...\", \"sections\": [{\"title\": \"...\", \"content\": \"...\"}], \"sources\": [{\"title\": \"...\", \"url\": \"...\", \"snippet\": \"...\"}]}\n\n" + prompt
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
                # Print a dot to show progress
                print(".", end="", flush=True)
        
        print("\n")
        print(f"Raw response preview: {full_response[:200]}...")  # Print first 200 chars for debugging
        
        # Try to extract JSON from the response
        try:
            # Look for JSON-like structure in the response
            json_start = full_response.find('{')
            json_end = full_response.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = full_response[json_start:json_end]
                result = json.loads(json_str)
                print("Successfully parsed JSON response!")
                print(f"Summary: {result.get('summary', '')[:100]}...")
                print(f"Number of sections: {len(result.get('sections', []))}")
                print(f"Number of sources: {len(result.get('sources', []))}")
            else:
                print("No JSON structure found in the response")
                result = {
                    "summary": "Failed to parse response as JSON",
                    "sections": [{"title": "Raw Response", "content": full_response}],
                    "sources": []
                }
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            result = {
                "summary": "Failed to parse response as JSON",
                "sections": [{"title": "Raw Response", "content": full_response}],
                "sources": []
            }
        
        # Update the status
        active_research_tasks[research_id]["status"] = "completed"
        print("Research completed successfully!")
        
    except Exception as e:
        # Handle errors
        active_research_tasks[research_id]["status"] = "failed"
        active_research_tasks[research_id]["error"] = str(e)
        print(f"Research error: {e}")

if __name__ == "__main__":
    asyncio.run(test_research_without_db_save()) 