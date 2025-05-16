import json
import pytest
from pydantic_extra_types.phone_numbers import PhoneNumber
from starlette.responses import JSONResponse
from app.utils.helpers import generate_error_response, format_error_response, prepare_pydantic_phone_number_for_verify


@pytest.fixture
def error_dictionary():
    return {'messageId': 'CSIBN0028E', 'messageDescription': 'The system cannot process the request because the verification was not found.'}

def test_generate_error_response(error_dictionary):
    status_code = 400
    error_response = generate_error_response(status_code, format_error_response(error_dictionary))
    body = json.loads(error_response.body.decode('utf-8')) # The body is returned as bytes for some reason.

    assert type(error_response) == JSONResponse
    assert error_response.status_code == 400
    assert body.get('success') == False
    assert body.get('message') == 'CSIBN0028E - The system cannot process the request because the verification was not found.'


def test_format_error_response(error_dictionary):
    formatted_message = format_error_response(error_dictionary)
    assert formatted_message == "CSIBN0028E - The system cannot process the request because the verification was not found."


@pytest.mark.parametrize("sample_phone_number", ["+1(902)555-5555", "+1902555-5555", "19025555555", "tel:+1-902-555-5555"])
def test_prepare_pydantic_phone_number_for_verify(sample_phone_number):
    verify_formatted_phone_number = prepare_pydantic_phone_number_for_verify(PhoneNumber(sample_phone_number))
    assert verify_formatted_phone_number == "19025555555"
