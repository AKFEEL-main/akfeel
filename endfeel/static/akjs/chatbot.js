document.addEventListener("DOMContentLoaded", function () {
    const chatbotContainer = document.getElementById("chatbot-container");
    const chatbotBtn = document.getElementById("chatbot-btn");
    const closeChatbot = document.getElementById("close-chatbot");
    const sendBtn = document.getElementById("send-btn");
    const stopBtn = document.getElementById("stop-btn");
    const userInput = document.getElementById("user-input");
    const messagesContainer = document.getElementById("chatbot-messages");

    let isFirstOpen = true;
    let stopTyping = false;
    let typingInterrupted = false;

    chatbotBtn.addEventListener("click", function () {
        if (chatbotContainer.style.display === "none" || chatbotContainer.style.display === "") {
            chatbotContainer.style.display = "flex";

            if (isFirstOpen) {
                setTimeout(() => {
                    appendTypingMessage("챗봇", "안녕하세요! 무엇을 도와드릴까요?");
                }, 150);
                isFirstOpen = false;
            }
        } else {
            chatbotContainer.style.display = "none";
        }
    });

    closeChatbot.addEventListener("click", function () {
        chatbotContainer.style.display = "none";
    });

    userInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter" && !userInput.disabled) {
            sendMessage();
        }
    });

    sendBtn.addEventListener("click", sendMessage);

    stopBtn.addEventListener("click", function () {
        stopTyping = true;
        typingInterrupted = true; 
    });


    function appendMessage(sender, text, type) {
        const messageWrapper = document.createElement("div");
        messageWrapper.classList.add("message-wrapper", type);

        const senderName = document.createElement("div");
        senderName.classList.add("message-sender");
        senderName.innerText = sender;

        const message = document.createElement("div");
        message.classList.add("chat-message", type);
        message.innerHTML = text;

        messageWrapper.appendChild(senderName);
        messageWrapper.appendChild(message);
        messagesContainer.appendChild(messageWrapper);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // 챗봇 타이핑 효과
    function appendTypingMessage(sender, text) {
        const messageWrapper = document.createElement("div");
        messageWrapper.classList.add("message-wrapper", "bot");

        const senderName = document.createElement("div");
        senderName.classList.add("message-sender");
        senderName.innerText = sender;

        const message = document.createElement("div");
        message.classList.add("chat-message", "bot");
        message.innerHTML = `<span class="typing-effect"></span>`;

        messageWrapper.appendChild(senderName);
        messageWrapper.appendChild(message);
        messagesContainer.appendChild(messageWrapper);

        const typingSpan = message.querySelector(".typing-effect");
        let i = 0;

        userInput.disabled = true;
        userInput.placeholder = "챗봇이 채팅을 입력하고 있습니다.";
        stopBtn.style.opacity = "1";
        stopBtn.style.pointerEvents = "auto";

        function typeCharacter() {
            if (stopTyping) {
                stopTyping = false;
                stopBtn.style.opacity = "0.5";
                stopBtn.style.pointerEvents = "none";
                userInput.disabled = false;
                userInput.placeholder = "메시지를 입력하세요.";
                return;
            }

            if (i < text.length) {
                typingSpan.innerHTML += text.charAt(i);
                i++;
                setTimeout(typeCharacter, 50);
            } else {
                userInput.disabled = false;
                userInput.placeholder = "메시지를 입력하세요.";
                stopBtn.style.opacity = "0.5";
                stopBtn.style.pointerEvents = "none";
            }
        }

        typeCharacter();
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async function sendMessage() {
        const userText = userInput.value.trim();
        if (!userText) return;

        appendMessage("사용자", userText, "user");
        userInput.value = "";

        stopTyping = false;
        typingInterrupted = false;

        try {
            const response = await fetch("/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userText })
            });

            if (!response.ok) {
                throw new Error(`HTTP 오류 상태 코드: ${response.status}`);
            }

            const data = await response.json();

            if (!typingInterrupted) {
                appendTypingMessage("챗봇", data.response);
            } else {
                appendMessage("챗봇", data.response, "bot");
            }

        } catch (error) {
            console.error("Error:", error);
            appendTypingMessage("챗봇", "서버 오류가 발생했습니다.");
        }
    }
});
