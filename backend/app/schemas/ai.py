from pydantic import BaseModel


class SmartReplyRequest(BaseModel):
    messages: list[str]


class SmartReplyResponse(BaseModel):
    suggestions: list[str]


class ToxicityRequest(BaseModel):
    text: str


class ToxicityResponse(BaseModel):
    is_toxic: bool
    confidence: float
    label: str


class SummarizeRequest(BaseModel):
    messages: list[str]
    num_sentences: int = 5


class SummarizeResponse(BaseModel):
    summary: str
