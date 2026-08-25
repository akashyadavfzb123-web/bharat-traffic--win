from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.security import hash_password
from app.models.user import User, UserRole


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def register_user(db: Session, *, email: str, name: str, password: str) -> User:
    """Create a new USER-account.

    Deliberately accepts no role argument: public registration can never
    create an ADMIN. Admins are promoted out-of-band (e.g. direct DB update).
    """
    if get_user_by_email(db, email) is not None:
        raise AppError(status_code=409, detail="Email already registered")

    user = User(
        email=email,
        name=name,
        password_hash=hash_password(password),
        role=UserRole.USER,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
