from pydantic import BaseModel, EmailStr, model_validator


class RegisterRequest(BaseModel):
    name: str = ""
    full_name: str | None = None
    email: EmailStr
    password: str

    @model_validator(mode="after")
    def populate_name(self):
        if not self.name and self.full_name:
            self.name = self.full_name
        if not self.name:
            self.name = self.email.split("@")[0]
        return self


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
