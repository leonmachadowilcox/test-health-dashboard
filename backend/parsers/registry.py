"""Maps an `{format}` path segment from POST /upload/{format} to a parser
function. Add new formats (e.g. "junit" for JUnit XML) here as they land —
each parser must take raw text and return a models.ParsedResult.
"""

from typing import Any, Callable

from models import ParsedResult
from parsers import jest_parser

ParserFn = Callable[[Any], ParsedResult]

SUPPORTED_FORMATS: dict[str, ParserFn] = {
    "jest": jest_parser.parse,
}


class UnsupportedFormatError(Exception):
    def __init__(self, requested_format: str):
        supported = ", ".join(sorted(SUPPORTED_FORMATS))
        super().__init__(
            f"Unsupported format '{requested_format}'. Supported formats: {supported}."
        )


def get_parser(format: str) -> ParserFn:
    parser = SUPPORTED_FORMATS.get(format.lower())
    if parser is None:
        raise UnsupportedFormatError(format)
    return parser
