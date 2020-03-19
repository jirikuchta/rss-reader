import pytest
from xml.etree import ElementTree as ET

from rss_reader.parser.common import NS


def pytest_runtestloop(session: pytest.Session) -> None:
    for prefix, uri in NS.items():
        ET.register_namespace(prefix, uri)
