from pydantic import BaseModel


class StandardResponse(BaseModel):
    status: str


class ErrorResponse(BaseModel):
    detail: str
