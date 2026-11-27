import argparse
import os

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.models import Role, User
from app.auth.schemas import RegisterRequest
from app.auth.security import password_hash
from app.db import get_engine


def create_admin(email: str, name: str) -> None:
    data = RegisterRequest(email=email, name=name, password=os.environ["ADMIN_PASSWORD"])
    with Session(get_engine()) as db:
        if db.scalar(select(User).where(User.email == data.email)) is not None:
            raise SystemExit("Email already registered; no account was changed")
        db.add(
            User(
                email=data.email,
                name=data.name,
                password_hash=password_hash.hash(data.password),
                role=Role.ADMIN,
            )
        )
        db.commit()
    print("Administrator created")


def main() -> None:
    parser = argparse.ArgumentParser(description="DriveRent management commands")
    commands = parser.add_subparsers(dest="command", required=True)
    admin = commands.add_parser("create-admin")
    admin.add_argument("--email", required=True)
    admin.add_argument("--name", required=True)
    args = parser.parse_args()
    if args.command == "create-admin":
        create_admin(args.email, args.name)


if __name__ == "__main__":
    main()
