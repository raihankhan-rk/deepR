from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Source(BaseModel):
    title: str
    url: str
    snippet: Optional[str] = None

class ResearchRequest(BaseModel):
    topic: str
    additional_context: Optional[str] = None

class ResearchResponse(BaseModel):
    research_id: str
    status: str
    estimated_time: Optional[int] = None

class ReportSection(BaseModel):
    title: str
    content: str

class Report(BaseModel):
    id: str
    topic: str
    summary: str
    sections: List[ReportSection]
    sources: List[Source]
    created_at: datetime

class ReportResponse(BaseModel):
    id: str
    topic: str
    summary: str
    sections: List[ReportSection]
    sources: List[Source]
    created_at: str
    
    class Config:
        from_attributes = True

class ResearchHistory(BaseModel):
    id: str
    user_id: int
    topic: str
    created_at: str

class ResearchHistoryResponse(BaseModel):
    researches: List[ResearchHistory] 