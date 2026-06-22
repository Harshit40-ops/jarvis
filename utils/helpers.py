import re


def sanitize_name(name: str) -> str:
    """Strip characters that are illegal in Windows file/folder names."""
    name = name.strip()
    name = re.sub(r'[\\/*?:"<>|]', "", name)
    name = name.replace(" ", "_")
    return name
