import os
import google.generativeai as genai


api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    print("Error: GEMINI_API_KEY not found.")
    print("Please set it as an environment variable or hardcode it for testing.")
    exit()

# 2. Configure the SDK
genai.configure(api_key=api_key)

print("Available Gemini Models:\n")
print("-" * 60)

# 3. Fetch and print the available models
try:
    for model in genai.list_models():
        # We can look at what each model is designed to do
        print(f"Model ID:    {model.name}")
        print(f"Name:        {model.display_name}")
        print(f"Description: {model.description}")
        
        # 'generateContent' means it's a standard text/multimodal generation model
        # 'embedContent' means it's an embedding model
        methods = ", ".join(model.supported_generation_methods)
        print(f"Methods:     {methods}")
        print("-" * 60)
        
except Exception as e:
    print(f"Failed to fetch models. Error: {e}")