from datetime import datetime
from typing import Annotated, Literal

from pydantic import EmailStr, Field, StringConstraints, field_validator

from app.auth.models import Role
from app.common import InputModel, OutputModel

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
Password = Annotated[str, Field(min_length=8, max_length=128)]


class Credentials(InputModel):
    email: EmailStr
    password: Password

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, value: str) -> str:
        return value.lower()


class RegisterRequest(Credentials):
    name: Name


class UserResponse(OutputModel):
    id: int
    name: str
    email: EmailStr
    role: Role
    created_at: datetime


class TokenResponse(OutputModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int = 3600
