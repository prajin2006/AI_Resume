import os
import json
import re
import httpx
from typing import Dict, Any, Optional, List
from app.core.config import settings

def clean_json_response(raw_text: str) -> str:
    """Extract JSON from raw LLM output, removing markdown code fences."""
    text = raw_text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

class LLMService:
    def __init__(self):
        self.provider = settings.AI_PROVIDER.lower()
        self.api_key = settings.AI_API_KEY or settings.OPENAI_API_KEY or os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY", "")

    async def generate_completion(self, system_prompt: str, user_prompt: str, temperature: float = 0.2) -> str:
        """Call the configured LLM provider or fallback gracefully."""
        # 1. Try Gemini if configured
        if self.provider == "gemini" or (self.api_key and "AIza" in self.api_key):
            try:
                res = await self._call_gemini(system_prompt, user_prompt, temperature)
                if res:
                    return res
            except Exception as e:
                print(f"[LLMService] Gemini API call error: {e}")

        # 2. Try OpenAI if configured
        if self.provider == "openai" or (self.api_key and self.api_key.startswith("sk-")):
            try:
                res = await self._call_openai(system_prompt, user_prompt, temperature)
                if res:
                    return res
            except Exception as e:
                print(f"[LLMService] OpenAI API call error: {e}")

        # 3. Return None to allow service-level heuristic fallback
        return ""

    async def _call_gemini(self, system_prompt: str, user_prompt: str, temperature: float) -> str:
        api_key = self.api_key or settings.AI_API_KEY
        if not api_key:
            return ""
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.AI_MODEL}:generateContent?key={api_key}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"{system_prompt}\n\nUser Request:\n{user_prompt}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": 4096
            }
        }
        
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                try:
                    return data["candidates"][0]["content"]["parts"][0]["text"]
                except (KeyError, IndexError):
                    return ""
            else:
                print(f"[LLMService] Gemini error {resp.status_code}: {resp.text}")
                return ""

    async def _call_openai(self, system_prompt: str, user_prompt: str, temperature: float) -> str:
        api_key = self.api_key or settings.OPENAI_API_KEY
        if not api_key:
            return ""

        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.OPENAI_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": temperature
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
            else:
                print(f"[LLMService] OpenAI error {resp.status_code}: {resp.text}")
                return ""

    async def generate_vision_completion(self, image_bytes: bytes, mime_type: str = "image/jpeg", prompt: str = "Extract all text and structure from this resume image accurately.") -> str:
        """Extract text from an image or scanned document using Vision LLM."""
        import base64
        b64_data = base64.b64encode(image_bytes).decode('utf-8')

        # 1. Try Gemini Vision
        api_key = self.api_key or settings.AI_API_KEY
        if api_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.AI_MODEL}:generateContent?key={api_key}"
                payload = {
                    "contents": [
                        {
                            "parts": [
                                {"text": prompt},
                                {
                                    "inline_data": {
                                        "mime_type": mime_type,
                                        "data": b64_data
                                    }
                                }
                            ]
                        }
                    ],
                    "generationConfig": {"temperature": 0.1, "maxOutputTokens": 4096}
                }
                async with httpx.AsyncClient(timeout=60.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        return data["candidates"][0]["content"]["parts"][0]["text"]
            except Exception as e:
                print(f"[LLMService] Gemini Vision error: {e}")

        # 2. Try OpenAI Vision
        openai_key = self.api_key or settings.OPENAI_API_KEY
        if openai_key and openai_key.startswith("sk-"):
            try:
                url = "https://api.openai.com/v1/chat/completions"
                headers = {"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"}
                payload = {
                    "model": settings.OPENAI_MODEL,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64_data}"}}
                            ]
                        }
                    ],
                    "max_tokens": 4096
                }
                async with httpx.AsyncClient(timeout=60.0) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        return data["choices"][0]["message"]["content"]
            except Exception as e:
                print(f"[LLMService] OpenAI Vision error: {e}")

        return ""

llm_service = LLMService()
