from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import google.generativeai as genai
from langchain.schema import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

def create_app():
    app = Flask(__name__)
    CORS(app)

    # 환경 변수 불러오기
    load_dotenv("C:/projects/akfeel/config.env")

    # API 키 설정 불러오기
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    genai.configure(api_key=gemini_api_key)

    # 제미나이 모델 불러오기
    gemini_model = genai.GenerativeModel('gemini-1.5-flash')

    embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
    documents = [
        "akfeel 웹사이트의 이용방법은 다음과 같습니다.",
        "먼저, 이미지를 텍스트로 변환하는 방법입니다.",
        "1. 이미지 업로드 상자를 클릭하여 텍스트로 변환하고자 하는 이미지 파일을 선택하여 이미지 업로드 상자에 업로드합니다.",
        "또는 이미지를 드래그 앤 드롭하여 이미지를 이미지 업로드 상자에 넣습니다.",
        "이미지 삭제를 원할 시 삭제하기 버튼을 클릭하여 이미지를 삭제할 수 있습니다.",
        "2. 변환하기 버튼을 클릭하여 입력한 이미지를 텍스트로 변환합니다.",
        "3. 변환된 텍스트를 복사하기 버튼을 클릭하여 복사할 수 있습니다.",
        "4. 저장하기 버튼을 클릭하여 변환된 텍스트를 .txt 파일로 다운로드할 수 있습니다.",
        "프로젝트 팀명 akfeel(악필), 손글씨 이미지를 인식하여 텍스트로 변환하는 OCR 팀 프로젝트입니다.",
        "기존의 OCR 프로그램은 사용자의 필체 이미지를 대체로 잘 인식하여 텍스트로 변환하지만 필체가 악필이거나 교정부호 등이 간섭된 경우 정확도가 떨어지는 한계가 있습니다.",
        "이러한 한계점을 개선하고, 악필로 인해 인식하지 못하는 글씨의 경우 앞뒤 문맥을 고려하여 복원할 수 없는 글자들을 복원하는 프로그램을 제작하고자 합니다.",
        "akfeel 프로젝트 팀이 정의하는 악필의 기준은 다음과 같습니다.",
        "한글의 구조적 특징(자음과 모음의 조합, 받침의 위치 등)에서 자형의 균형과 정렬이 평균치에서 크게 벗어난 경우",
        "예상 고객으론 다음과 같습니다.",
        "출판사, 신문사 등 이미지에서 글자를 추출하는 업무가 필요한 회사 또는 일반 사용자",
        "악필 판독이 필요한 모든 사용자",
        "신체적 불편함으로 인해 글씨를 제대로 쓰기 어려운 고객",
        "대량의 주관식 답안지 채점 및 평가를 필요로 하는 고객",
        "현재 해당 페이지는 국내 서비스용으로 한글을 우선적으로 진행하며 추후 점차 개선 될 여지가 있습니다.",
        "제대로 이미지를 텍스트로 변환하지 못하였을 시 : 죄송합니다. 더 나은 서비스를 위해 점차 개선해 나가겠습니다.",
        "죄송합니다. 해당 사이트는 현재 개선 중에 있습니다. 따라서 사용자님의 요구사항을 제대로 충족하지 못할 수 있습니다.",
        "사용자님께서 입력하신 모든 이미지는 따로 저장되지 않고, 바로 텍스트로 출력하기 때문에 사용자님의 이미지 데이터가 akfeel 팀에 유출될 일을 없습니다.",
        "OCR 이 무엇인가요? : OCR 이란 텍스트 이미지를 기계가 읽을 수 있는 텍스트 포맷으로 변환하는 과정입니다. https://aws.amazon.com/ko/what-is/ocr/ 사이트 참고",

        "ocr 모델변경이 뭔가요? : 아직 개발 준비 중인 기능으로 다양한 ocr 모델을 적용하서 체험하실 수 있도록 준비된 기능입니다.",
        "현재는 우선 단어모델만 이용가능합니다.",

        "이미지를 넣고 다시 이미지를 넣기위해 클릭 한 후 열린 폴더 창에서 이미지를 선택하지 않고 취소 버튼을 누를 시",
        " 화면상에는 기존 이미지가 보이지만 시스템 상에는 이미지가 등록되지 않은 상태이므로 파일을 선택해주세요! 라는 알림",
        "창이 뜹니다. 해당 문제가 발생할 시에 삭제하기 버튼을 클릭 한 후 이미지를 다시 넣어주세요",

        "이미지를 텍스트로 변환하지 못할 경우 변환실패란 문구가 뜹니다.",

        "복사하기 버튼을 클릭할 시 원고지나 유선지 형태로 저장되는게아닌 백지 형태의 txt파일로 저장됩니다.",

        "현재 모델을 개발 중에 있어 단어모델만 우선 이용하실 수 있습니다.",

        "악필이는 akfeel 팀의 마스코트입니다.",

        "로그 옆의 악필이를 눌러보세요~ (이스터에그)"

    ]
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_text("\n".join(documents))
    faiss_db = FAISS.from_texts(splits, embedding_model)

    from endfeel.views.akmain_views import bp
    app.register_blueprint(bp)

    @app.route("/chat", methods=["POST"])
    def chat():
        try:
            data = request.json
            if not data or "message" not in data:
                return jsonify({"response": "메시지를 입력해주세요."}), 400

            user_input = data["message"]
            similar_docs = faiss_db.similarity_search(user_input, k=2)
            context = "\n".join([doc.page_content for doc in similar_docs])

            prompt = f"문맥 : {context}\n사용자 질문 : {user_input}\n답변 :"
            response = gemini_model.generate_content(prompt)
            chatbot_reply = response.candidates[0].content.parts[0].text if response.candidates else "응답을 생성할 수 없습니다."

            return jsonify({"response": chatbot_reply})

        except Exception as e:
            print("Error:", str(e))
            return jsonify({"response": "서버 오류 발생"}), 500

    return app
