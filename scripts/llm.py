import csv
import json
import requests
import os
import time

def process_text(text, api_key):
    """Process text through Claude API to classify and transform it."""
    
    prompt = f"""Analyze the following text and provide two outputs:

1. Classification: Determine if the text is an "opinion", "fact", or "proposal"
2. Transformed text: 
   - If it's a fact or proposal, convert it to the most equivalent opinion
   - Make it the most assertive opinion possible
   - Keep it concise

Text to analyze: "{text}"

Respond in JSON format:
{{
  "classification": "opinion|fact|proposal",
  "transformed_text": "your transformed text here"
}}"""

    retry_count = 0
    
    while True:
        try:
            response = requests.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01"
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 1000,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ]
                }
            )
            
            # Check for rate limit error
            if response.status_code == 429:
                retry_count += 1
                print(f"  ⏸ Rate limit hit. Waiting 15 seconds... (Retry {retry_count})")
                time.sleep(15)
                continue
            
            response.raise_for_status()
            data = response.json()
            
            # Extract and parse the response
            response_text = data['content'][0]['text']
            
            # Clean up markdown code blocks if present
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            result = json.loads(response_text)
            return result
            
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429:
                retry_count += 1
                print(f"  ⏸ Rate limit hit. Waiting 15 seconds... (Retry {retry_count})")
                time.sleep(15)
                continue
            else:
                raise

def process_csv(input_file, output_file, api_key):
    """Process CSV file and write results."""
    
    results = []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            text = row['text']
            print(f"Processing ID {row['id']}...")
            
            try:
                result = process_text(text, api_key)
                
                results.append({
                    'id': row['id'],
                    'original_text': text,
                    'classification': result['classification'],
                    'transformed_text': result['transformed_text']
                })
                
                print(f"  ✓ Classification: {result['classification']}")
                
            except Exception as e:
                print(f"  ✗ Error: {str(e)}")
                results.append({
                    'id': row['id'],
                    'original_text': text,
                    'classification': 'ERROR',
                    'transformed_text': str(e)
                })
    
    # Write results to output CSV
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        fieldnames = ['id', 'original_text', 'classification', 'transformed_text']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        
        writer.writeheader()
        writer.writerows(results)
    
    print(f"\n✓ Processing complete! Results saved to {output_file}")

if __name__ == "__main__":
    # Configure your files and API key
    INPUT_CSV = "input.csv"
    OUTPUT_CSV = "output.csv"
    API_KEY = "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"
    
    if not API_KEY:
        print("Error: ANTHROPIC_API_KEY environment variable not set")
        exit(1)
    
    process_csv(INPUT_CSV, OUTPUT_CSV, API_KEY)
