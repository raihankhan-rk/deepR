import json
import re

def test_json_parsing():
    # Define test cases
    test_cases = [
        {
            "name": "Clean JSON",
            "input": '{"summary": "This is a summary", "sections": [{"title": "Section 1", "content": "Content 1"}], "sources": [{"title": "Source 1", "url": "http://example.com", "snippet": "Example snippet"}]}',
            "expected_success": True
        },
        {
            "name": "JSON with newlines",
            "input": '''
{
  "summary": "This is a summary",
  "sections": [
    {
      "title": "Section 1",
      "content": "Content 1"
    }
  ],
  "sources": [
    {
      "title": "Source 1",
      "url": "http://example.com",
      "snippet": "Example snippet"
    }
  ]
}
''',
            "expected_success": True
        },
        {
            "name": "JSON in code block",
            "input": '''```json
{"summary": "This is a summary", "sections": [{"title": "Section 1", "content": "Content 1"}], "sources": [{"title": "Source 1", "url": "http://example.com", "snippet": "Example snippet"}]}
```''',
            "expected_success": True
        },
        {
            "name": "JSON with text before and after",
            "input": '''Here is your research report:

{"summary": "This is a summary", "sections": [{"title": "Section 1", "content": "Content 1"}], "sources": [{"title": "Source 1", "url": "http://example.com", "snippet": "Example snippet"}]}

I hope this helps!''',
            "expected_success": True
        },
        {
            "name": "Malformed JSON",
            "input": '{"summary": "This is a summary", "sections": [{"title": "Section 1", "content": "Content 1"}], "sources": [{"title": "Source 1", "url": "http://example.com", "snippet": "Example snippet}]}',
            "expected_success": False
        }
    ]

    # Function to parse JSON from various formats
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

    # Run tests
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test_case['name']}")
        print("-" * 50)
        print(f"Input: {test_case['input'][:50]}...")
        
        success, result = parse_json(test_case['input'])
        
        if success == test_case['expected_success']:
            print(f"✅ Test passed! Success: {success}")
            if success:
                print(f"Parsed result: {result}")
        else:
            print(f"❌ Test failed! Expected {test_case['expected_success']}, got {success}")
        
        print("-" * 50)

if __name__ == "__main__":
    test_json_parsing() 