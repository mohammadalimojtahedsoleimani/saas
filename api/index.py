from fastapi import FastAPI, Depends    # type: ignore
from fastapi.responses import PlainTextResponse  # type: ignore
from openai import OpenAI  # type: ignore
import os
from dotenv import load_dotenv
from pathlib import Path
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials

from fastapi.responses import StreamingResponse

load_dotenv(Path(__file__).resolve().parent.parent/".env")

OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL")
OPENROUTER_API_KEY= os.getenv("OPENROUTER_API_KEY")

clerk_config = ClerkConfig(jwks_url=os.getenv("CLERK_JWKS_URL"))
clerk_guard = ClerkHTTPBearer(clerk_config)
app = FastAPI()

@app.get("/api", response_class=PlainTextResponse)
def idea(creds: HTTPAuthorizationCredentials = Depends(clerk_guard)):
    user_id = creds.decoded["sub"] 

    client = OpenAI(api_key=OPENROUTER_API_KEY,
        base_url=OPENROUTER_BASE_URL,)
    prompt = [{"role": "user", "content": "Reply with a new business idea for AI Agents, formatted with headings, sub-headings and bullet points"}]
    response = client.chat.completions.create(model="openai/gpt-oss-120b", messages=prompt, stream=True)
    def event_stream():
        for chunk in response:
            text = chunk.choices[0].delta.content
            if text:
                lines = text.split("\n")
                for line in lines[:-1]:
                    yield f"data: {line}\n\n"
                    yield "data:  \n"
                yield f"data: {lines[-1]}\n\n"
    return StreamingResponse(event_stream(), media_type="text/event-stream")



