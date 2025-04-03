import io
from flask import Flask
from dotenv import load_dotenv
import os
from flask import Blueprint, render_template, request, jsonify
from PIL import Image
from akmodel.test_attn_ocr_model import predict_text        
from akmodel.test_ocr import predict_text  as predict_texto_ocr
from akmodel.test_crnn import predict_crnn_text
from akmodel.crnn_long_txt_test import predict_hybridocr
from akmodel.attn_long_txt_test import predict_text as predict_text_long

# .env 파일 불러오기
load_dotenv()

app = Flask(__name__)

# 환경 변수에서 SECRET_KEY 가져오기
app.secret_key = os.getenv('SECRET_KEY')

bp = Blueprint("akmain", __name__)

@bp.route("/", methods=["GET"]) 
def index():
    return render_template("akmain.html")

@bp.route("/akfeel", methods=["GET", "POST"])
def akfeelel():
    return render_template("akfeelmascot.html")

@bp.route("/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"error" : "이미지가 업로드되지 않았습니다."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error" : "파일이 선택되지 않았습니다."}), 400

    # print(f"업로드된 파일 : {file.filename}")

    try:
        file_bytes = file.read()
        image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        model_type = request.form.get("model_type", "attn")
        temp_image_path = "temp_uploaded_image.png"
        image.save(temp_image_path)

        # ocr 기재하기
        if model_type == 'crnn':
            extracted_text = predict_crnn_text(temp_image_path)
        elif model_type == 'attn2':
            extracted_text = predict_text(image)
        elif model_type == 'crnnlongtxt':
            extracted_text = predict_hybridocr(temp_image_path, "C:/projects/akfeel/akmodel/hybrid_ocr_best_m_3_26.pth")
        elif model_type == 'attnlogtxt' :
            extracted_text = predict_text_long(image)
        else:
            extracted_text = predict_texto_ocr(image)
                
        # OCR이 끝난 후 이미지 삭제
        if os.path.exists(temp_image_path):
            os.remove(temp_image_path)
        print(f"OCR 원본 결과 : [{extracted_text}]")  

        return jsonify({"text": extracted_text})

    except Exception as e:
        print(f"서버 오류 발생 : {e}")
        return jsonify({"error" : str(e)}), 500


@bp.route("/change_model", methods=["POST"])
def change_model():
    data = request.get_json()
    model_type = data['model']

    # print(f"선택된 모델 : {model_type}")

    return jsonify({"message" : f"{model_type} 모델로 변경 완료"})
