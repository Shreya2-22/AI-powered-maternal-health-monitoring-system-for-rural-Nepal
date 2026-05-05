"""Compatibility entry point for the legacy API test contract.

The production app lives in server.py. This module exposes a lightweight
FastAPI app that matches the older chat response shape expected by the tests.
"""

from datetime import datetime

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from chat_service import PregnancyChatService


app = FastAPI(title="AamaSuraksha Test API")
chat_service = PregnancyChatService()


class ChatRequest(BaseModel):
	message: str = Field(min_length=1, max_length=1000)
	language: str = "en"
	session_id: str = "global"
	memory_turns: int = Field(default=6, ge=1, le=10)


@app.post("/api/chat")
async def chat(request: ChatRequest):
	message = request.message.strip()
	if not message:
		raise HTTPException(status_code=400, detail="Message is required")

	result = chat_service.answer(
		message,
		language=request.language,
		session_id=request.session_id,
		memory_turns=request.memory_turns,
	)

	return {
		"reply": result.reply,
		"intent": result.intent,
		"restricted": result.restricted,
		"emergency": result.emergency,
		"confidence": result.confidence,
		"context_used": result.context_used,
		"timestamp": datetime.now().isoformat(),
	}

