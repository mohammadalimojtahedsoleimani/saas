from fastapi import FastAPI  # type: ignore
from fastapi.responses import PlainTextResponse  # type: ignore
from openai import OpenAI  # type: ignore
import os
from dotenv import load_dotenv
from pathlib import Path

from fastapi.responses import StreamingResponse

load_dotenv(Path(__file__).resolve().parent.parent/".env")

OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL")
OPENROUTER_API_KEY= os.getenv("OPENROUTER_API_KEY")
app = FastAPI()

@app.get("/api", response_class=PlainTextResponse)
def idea():
    client = OpenAI(api_key=OPENROUTER_API_KEY,
        base_url=OPENROUTER_BASE_URL,)
    prompt = [{"role": "user", "content": "Reply with a new business idea for AI Agents, formatted with headings, sub-headings and bullet points"}]
    response = client.chat.completions.create(model="openai/gpt-oss-120b", messages=prompt, stream=True)
    def event_stream():
        for chunk in response:
            text = chunk.choices[0].delta.content
            if text:
                lines = text.split("\n")
                for line in lines:
                    yield f"data: {line}\n"
                yield "\n"
    return StreamingResponse(event_stream(), media_type="text/event-stream")



# from fastapi import FastAPI
# from fastapi.responses import PlainTextResponse

# app = FastAPI()

# @app.get("/api", response_class=PlainTextResponse)
# def idea():
#     return "FastAPI is working on Vercel!"
