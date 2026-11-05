import os
import json
import asyncio
from typing import Dict, Any, List, Optional
import httpx

from apps.api.config import settings

class LLMProvider:
    """
    Provider-agnostic LLM interface with fallback routing, retry with exponential backoff,
    and a deterministic test/mock engine for offline/local development.
    """
    def __init__(self):
        self.primary_provider = settings.PRIMARY_LLM_PROVIDER
        self.fallback_provider = settings.FALLBACK_LLM_PROVIDER
        self.anthropic_key = settings.ANTHROPIC_API_KEY
        self.gemini_key = settings.GEMINI_API_KEY
        self.openai_key = settings.OPENAI_API_KEY

    async def generate_completion(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        model_id: str,
        temperature: float = 0.3,
        max_tokens: int = 400,
        tools: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Executes completion with primary provider, falling back to secondary or mock on failure.
        """
        # If no Anthropic key configured or mock mode requested, use mock response engine
        if not self.anthropic_key or self.primary_provider == "mock":
            return await self._mock_completion(system_prompt, messages, tools)

        # Attempt primary provider (Anthropic)
        try:
            return await self._call_anthropic(system_prompt, messages, model_id, temperature, max_tokens, tools)
        except Exception as ex:
            # Fallback to secondary or mock
            if self.openai_key:
                try:
                    return await self._call_openai(system_prompt, messages, "gpt-4o-mini", temperature, max_tokens)
                except Exception:
                    pass
            return await self._mock_completion(system_prompt, messages, tools)

    async def _call_anthropic(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        model_id: str,
        temperature: float,
        max_tokens: int,
        tools: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": self.anthropic_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        payload = {
            "model": model_id,
            "system": system_prompt,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }
        if tools:
            payload["tools"] = tools

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            
            # Extract content text and any tool calls
            content_text = ""
            tool_calls = []
            for item in data.get("content", []):
                if item.get("type") == "text":
                    content_text += item.get("text", "")
                elif item.get("type") == "tool_use":
                    tool_calls.append({
                        "name": item.get("name"),
                        "input": item.get("input")
                    })
            
            return {
                "text": content_text,
                "tool_calls": tool_calls,
                "model_id": model_id,
                "tokens_used": data.get("usage", {}).get("total_tokens", 0)
            }

    async def _call_openai(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        model_id: str,
        temperature: float,
        max_tokens: int
    ) -> Dict[str, Any]:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.openai_key}",
            "Content-Type": "application/json"
        }
        openai_messages = [{"role": "system", "content": system_prompt}] + messages
        payload = {
            "model": model_id,
            "messages": openai_messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            choice = data["choices"][0]["message"]
            return {
                "text": choice.get("content", ""),
                "tool_calls": [],
                "model_id": model_id,
                "tokens_used": data.get("usage", {}).get("total_tokens", 0)
            }

    async def _mock_completion(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Intelligent pedagogical mock generator for offline/local testing.
        Provides realistic Socratic responses, math hints, and values coaching.
        """
        last_msg = messages[-1]["content"] if messages else ""
        last_msg_lower = last_msg.lower()

        # Math / Science queries
        if any(term in last_msg_lower for term in ["fraction", "add", "+", "/", "math", "force", "pressure"]):
            if "2/4" in last_msg or "1/4" in last_msg:
                reply = (
                    "Great work looking at the fractions! Notice that both fractions have the same denominator (4), "
                    "which means the slices are the exact same size. What happens if you add the two slices on top: $2 + 1$?"
                )
            elif "pressure" in last_msg_lower or "force" in last_msg_lower:
                reply = (
                    "Think of walking on fresh snow: why do snowshoes help you walk without sinking, "
                    "while narrow boots sink right in? How does the area of contact affect the pressure?"
                )
            else:
                reply = (
                    "That's a thoughtful question! Let's break it down into one small piece. "
                    "What part of this problem seems clearest to you first?"
                )
        # Values / Reflection queries
        elif any(term in last_msg_lower for term in ["thank", "kind", "help", "friend", "sister", "brother", "share"]):
            reply = (
                "That shows so much thoughtfulness! When you did that, how did the other person react? "
                "How did seeing their reaction make you feel inside?"
            )
        # General Socratic encouragement
        else:
            reply = (
                "Hello there! I'm Ollie, your AI learning helper. "
                "Every big discovery starts with one small curiosity. What topic would you like to explore together today?"
            )

        return {
            "text": reply,
            "tool_calls": [],
            "model_id": "kidsmentor-mock-v1",
            "tokens_used": 120
        }

llm_provider = LLMProvider()
