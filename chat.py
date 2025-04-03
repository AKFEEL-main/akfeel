from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv
import traceback
from endfeel import create_app

app = create_app()
load_dotenv("config.env")

gemini_api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=gemini_api_key)
gemini_model = genai.GenerativeModel(model_name="gemini-1.5-flash")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.json
        if not data or "message" not in data:
            return jsonify({"response" : "메시지를 입력해주세요."}), 400

        user_input = data["message"]
        print(f"사용자 입력 : {user_input}")

        with app.app_context():
            similar_docs = app.faiss_db.similarity_search(user_input, k=2)

        if len(similar_docs) == 0:
            print("관련 문서를 찾지 못함")
            context = "관련 문서를 찾지 못했습니다. 일반적인 답변을 제공하겠습니다."
        else:
            context = "\n".join([doc.page_content for doc in similar_docs])

        prompt = f"""
        다음은 사용자의 질문과 관련 있는 참고 문서입니다. 하지만, 이 문서에 답이 없을 경우 일반적인 지식을 활용하여 답변해 주세요.

        참고 문서 :
        {context}

        사용자 질문 :
        {user_input}

        답변 : 간단하게 알려주시고 사용자가 자세한 설명을 요청 시엔 자세하게 설명해주세요.
        """
        response = gemini_model.generate_content(prompt)
        chatbot_reply = response.candidates[0].content.parts[0].text if response.candidates else "응답을 생성할 수 없습니다."

        print(f"챗봇 응답: {chatbot_reply}")

        return jsonify({"response": chatbot_reply})

    except Exception as e:
        print("[chat.py] 챗봇 오류 발생:")
        # print(traceback.format_exc())
        return jsonify({"response" : f"서버 오류 발생: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
