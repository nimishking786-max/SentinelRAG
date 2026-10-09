import re
from typing import Dict, Any, List

class PromptGuard:
    """
    Enterprise-grade heuristic & pattern engine for prompt injection,
    jailbreak attempts, and system directive exfiltration.
    """
    
    INJECTION_RULES = [
        # Direct override attacks
        (r"(?i)ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules|directives)", "INSTRUCTION_OVERRIDE", 95, "Direct attempt to override system constraints"),
        (r"(?i)disregard\s+(all\s+)?(previous|prior|system)\s+(instructions|directives|guidelines)", "INSTRUCTION_OVERRIDE", 95, "Attempt to disregard governing rules"),
        (r"(?i)forget\s+(all\s+)?(previous|prior)\s+(instructions|conversations|rules)", "INSTRUCTION_OVERRIDE", 92, "Instruction reset attack"),
        
        # Jailbreak & Developer Mode personas
        (r"(?i)(you\s+are\s+now|act\s+as)\s+(DAN|developer\s+mode|unconstrained|unfiltered|jailbroken|god\s+mode)", "JAILBREAK_PERSONA", 99, "Persona hijacking / DAN jailbreak attempt"),
        (r"(?i)developer\s+mode\s+output", "DEVELOPER_MODE_BYPASS", 90, "Simulated developer bypass mode"),
        (r"(?i)enable\s+(jailbreak|dev\s+mode|unfiltered\s+mode)", "JAILBREAK_PERSONA", 94, "Explicit request to disable guardrails"),
        
        # System Prompt / Context Leaks
        (r"(?i)(print|show|display|reveal|dump|repeat|output)\s+(all\s+)?(system\s+prompt|system\s+instructions|initial\s+prompt|hidden\s+context|internal\s+instructions)", "PROMPT_EXFILTRATION", 98, "System prompt extraction attack"),
        (r"(?i)what\s+are\s+your\s+(exact\s+)?(system\s+instructions|system\s+rules|internal\s+prompts)", "PROMPT_EXFILTRATION", 88, "Internal directive reconnaissance"),
        
        # System Overrides & Delimiter Injections
        (r"(?i)system\s+override", "SYSTEM_OVERRIDE", 95, "System override keyword invocation"),
        (r"(?i)override\s+(all\s+)?(system|security|rbac|safety)\s+(controls|policies|instructions)", "SECURITY_POLICY_OVERRIDE", 96, "Direct security boundary bypass attempt"),
        (r"(?i)bypass\s+(all\s+)?(restrictions|permissions|filters|firewalls|guards)", "SECURITY_POLICY_OVERRIDE", 94, "Security filter bypass directive"),
        (r"(?i)---+\s*(END\s+OF\s+SYSTEM|START\s+OF\s+NEW)\s*---+", "DELIMITER_INJECTION", 90, "Context delimiter injection attack"),
        
        # Obfuscated Base64 / Hex payloads
        (r"(?i)base64\s+decode\s+and\s+(execute|run|follow)", "OBFUSCATION_ATTACK", 85, "Obfuscated payload execution request"),
    ]

    @classmethod
    def detect_injection(cls, text: str) -> bool:
        """Quick boolean check for guard middleware."""
        analysis = cls.analyze_prompt(text)
        return not analysis["is_safe"]

    @classmethod
    def analyze_prompt(cls, text: str) -> Dict[str, Any]:
        """
        Comprehensive real-time prompt security analysis.
        Returns safety verdict, risk score, category, matched triggers, and token highlights.
        """
        if not text or not text.strip():
            return {
                "is_safe": True,
                "risk_score": 0,
                "threat_level": "SAFE",
                "category": None,
                "matched_pattern": None,
                "explanation": "No input provided.",
                "highlights": []
            }

        cleaned = text.strip()
        matched_rules = []
        highlights = []

        for pattern, category, score, explanation in cls.INJECTION_RULES:
            match = re.search(pattern, cleaned)
            if match:
                matched_rules.append({
                    "category": category,
                    "score": score,
                    "explanation": explanation,
                    "matched_text": match.group(0)
                })
                highlights.append({
                    "start": match.start(),
                    "end": match.end(),
                    "text": match.group(0),
                    "category": category
                })

        if matched_rules:
            # Pick highest severity rule
            top_rule = max(matched_rules, key=lambda r: r["score"])
            threat_level = "CRITICAL" if top_rule["score"] >= 90 else "HIGH" if top_rule["score"] >= 75 else "MEDIUM"
            return {
                "is_safe": False,
                "risk_score": top_rule["score"],
                "threat_level": threat_level,
                "category": top_rule["category"],
                "matched_pattern": top_rule["matched_text"],
                "explanation": top_rule["explanation"],
                "highlights": highlights
            }

        return {
            "is_safe": True,
            "risk_score": 5,
            "threat_level": "SAFE",
            "category": None,
            "matched_pattern": None,
            "explanation": "Prompt passed Sentinel heuristic safety evaluation with zero injection patterns detected.",
            "highlights": []
        }


class PIIDetector:
    """
    Detects and actively masks Personally Identifiable Information (PII)
    in generated AI context or output streams.
    """
    
    PII_RULES = [
        ("ssn", r"\b\d{3}-\d{2}-\d{4}\b", "[REDACTED SSN]"),
        ("credit_card", r"\b(?:\d{4}[ -]?){3}\d{4}\b|\b(?:\d[ -]*?){13,16}\b", "[REDACTED CARD]"),
        ("email", r"\b[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\b", "[REDACTED EMAIL]"),
        ("phone", r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b", "[REDACTED PHONE]"),
        ("bank_account", r"\b(CHASE|WF|BOA|CITI|ROUTING|ACCT)[-:\s]*\d{4,12}\b", "[REDACTED BANK ID]")
    ]

    @classmethod
    def contains_pii(cls, text: str) -> bool:
        if not text:
            return False
        for _, pattern, _ in cls.PII_RULES:
            if re.search(pattern, text):
                return True
        return False

    @classmethod
    def sanitize(cls, text: str) -> Dict[str, Any]:
        """
        Sanitizes text by masking all detected PII patterns.
        Returns sanitized text and list of redacted items.
        """
        if not text:
            return {"sanitized_text": "", "redacted_count": 0, "categories": []}

        sanitized = text
        redacted_count = 0
        detected_categories = []

        for category, pattern, replacement in cls.PII_RULES:
            matches = list(re.finditer(pattern, sanitized))
            if matches:
                redacted_count += len(matches)
                detected_categories.append(category)
                sanitized = re.sub(pattern, replacement, sanitized)

        return {
            "sanitized_text": sanitized,
            "redacted_count": redacted_count,
            "categories": list(set(detected_categories))
        }
