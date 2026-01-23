import base64
import logging
from typing import Dict #Makes return values clearer

import cv2
import numpy as np
import requests #to call the free OCR API

# Logging

logger = logging.getLogger(__name__)


# Configuration

TARGET_HEIGHT = 720
JPEG_QUALITY = 90

CLAHE_CLIP_LIMIT = 2.0 #contrast enhancement
CLAHE_TILE_GRID_SIZE = (8, 8) 

OCR_API_URL = "https://api.ocr.space/parse/image"
OCR_API_KEY = "helloworld"  # Free demo key


# Public API


def preprocess_frame_with_code(base64_frame: str) -> Dict[str, object]:
    """
    Full pipeline:
    Base64 → Image → Resize → CLAHE → Sharpen
           → JPEG encode
           → OCR via free API (code as string)
    """
    image = _decode_base64_to_image(base64_frame) #Converts Base64 string → OpenCV image
    image = _resize(image, TARGET_HEIGHT) # Shrinks image to max 720p
    image = _apply_clahe(image) # improves contrast
    image = _sharpen_for_text(image) # enhances sharpness of characters

    jpeg_bytes = _encode_jpeg(image, JPEG_QUALITY) #Converts the processed image into JPEG bytes
    code_text = _extract_code_text_via_api(jpeg_bytes) #sends it to further free api
    code_text = _normalize_code_text(code_text)# cleans out and wierd characters and unnecessary spacing

    return {
        "image_bytes": jpeg_bytes,
        "code_text": code_text
    }

# Step 1: Base64 → OpenCV

def _decode_base64_to_image(base64_frame: str) -> np.ndarray:
    try:
        image_bytes = base64.b64decode(base64_frame)#Converts Base64 text → raw image bytes
        buffer = np.frombuffer(image_bytes, dtype=np.uint8)#bytes → NumPy array
        image = cv2.imdecode(buffer, cv2.IMREAD_COLOR)#NumPy buffer → actual image, BGR mei dega yeh

        if image is None:
            raise ValueError("Image decode failed")

        return image

    except Exception as e:
        logger.exception("Base64 decode failed")
        raise RuntimeError("Invalid base64 image") from e


# Step 2: Resize

def _resize(image: np.ndarray, target_height: int) -> np.ndarray: # resizing the image inorder to keep the proportions intact
    height, width = image.shape[:2]# image height and width

    if height <= target_height:  # prevents waste token and fake detailing from being added
        return image
# now we'll resize the image and shrink it
    scale = target_height / height 
    new_width = int(width * scale)

    return cv2.resize(
        image,
        (new_width, target_height),
        interpolation=cv2.INTER_AREA
    )

# Step 3: CLAHE (to improve contrast)

def _apply_clahe(image: np.ndarray) -> np.ndarray:
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB) #converts BGR AND SEPRATES LIGHT/BRIGHTNESS
    l, a, b = cv2.split(lab) #

    clahe = cv2.createCLAHE(
        clipLimit=CLAHE_CLIP_LIMIT,
        tileGridSize=CLAHE_TILE_GRID_SIZE
    )

    l_enhanced = clahe.apply(l) # BRIGHTNESS KO ADJUST KRA H
    lab_enhanced = cv2.merge((l_enhanced, a, b)) # jo humne channels upr split kre the unko vapas recombine kr liya

    return cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)

# Step 3.5: Sharpening image;;; A convolution kernel (also known as a filter, mask, or window) is a small matrix of numbers used in image processing and convolutional neural networks (CNNs) to extract features, filter data, or transform images

def _sharpen_for_text(image: np.ndarray) -> np.ndarray:
    kernel = np.array([
        [0, -1,  0],
        [-1,  5, -1],
        [0, -1,  0]
    ])
    return cv2.filter2D(image, -1, kernel)


# Step 4: JPEG Encode

def _encode_jpeg(image: np.ndarray, quality: int) -> bytes: # converts jpeg format
    success, encoded = cv2.imencode(
        ".jpg",
        image,
        [int(cv2.IMWRITE_JPEG_QUALITY), quality]
    )

    if not success:
        raise RuntimeError("JPEG encoding failed")

    return encoded.tobytes()
#jpeg-> raw bytes

# Step 5: OCR via Free API;sends the image or video to ocr api

def _extract_code_text_via_api(jpeg_bytes: bytes) -> str:
    """
    Uses OCR.Space free API to extract code text.
    """
    try:#HTTP POST request
        response = requests.post(
            OCR_API_URL,
            files={"file": ("frame.jpg", jpeg_bytes)},
            data={
                "apikey": OCR_API_KEY,
                "language": "eng",
                "isOverlayRequired": False,
                "detectOrientation": True,
                "scale": True
            },
            timeout=20
        )

        response.raise_for_status()
        data = response.json()#converts it into python dict

        if data.get("IsErroredOnProcessing"):
            logger.error("OCR API error: %s", data)
            return ""

        parsed_results = data.get("ParsedResults", [])
        if not parsed_results:
            return ""

        return parsed_results[0].get("ParsedText", "").strip()

    except Exception as e:
        logger.exception("OCR API request failed")
        return ""


def preprocess_frame(base64_frame: str) -> bytes:
    # Step 1: Decode base64 to OpenCV image
    image = _decode_base64_to_image(base64_frame)

    # Step 2: Resize image
    image = _resize(image, TARGET_HEIGHT)

    # Step 3: Improve contrast
    image = _apply_clahe(image)

    # Step 4: Sharpen for text clarity
    image = _sharpen_for_text(image)

    # Step 5: Encode to JPEG bytes
    jpeg_bytes = _encode_jpeg(image, JPEG_QUALITY)

    return jpeg_bytes

 