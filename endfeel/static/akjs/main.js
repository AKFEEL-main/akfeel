const use_ex = document.getElementById("useex1");
const use_btn = document.getElementById("usebtn1");
const close_btn = document.getElementById("cls_use_button");

// 연필이미지 높이 지정 -> 글자에 따라 움직이도록 --> 이부분 확인 후 수정해야함
function updatePencilPosition() {
    const targettxt = document.getElementById("imgText");
    const pencilimg = document.querySelector(".pencil-container");

    if (!targettxt || !pencilimg) return;

    const isVisible = window.getComputedStyle(targettxt).display !== "none";

    if (!isVisible) {
        pencilimg.style.display = "none";
        return;
    }

    pencilimg.style.display = "block";

    const rect = targettxt.getBoundingClientRect();
    pencilimg.style.top = `${window.scrollY + rect.top + targettxt.scrollHeight}px`;
}

window.addEventListener("load", updatePencilPosition);
window.addEventListener("resize", updatePencilPosition);
window.addEventListener("scroll", updatePencilPosition);

setInterval(updatePencilPosition, 100);

//여기 까지


use_btn.addEventListener('click', ()=>{
    if(use_ex.style.display != "block"){
        use_ex.style.display = "block";
    }else{
        use_ex.style.display = "none"
    }
});

// 닫기 버튼 클릭 시
close_btn.addEventListener("click", () => {
    use_ex.style.display = "none";
});

document.querySelector(".copy-btn").addEventListener("click", function (event) {
    event.preventDefault(); // 기본 동작 --> 페이지 이동 막기

    let textOutput = document.getElementById("textOutput");
    let copyAlert = document.getElementById("copyAlert");
    let textToCopy = "";

    // 원고지일 때 칸 안의 텍스트만 가져옴
    if (textOutput.classList.contains("og-grid")) {
        let cells = textOutput.querySelectorAll(".og-cell");
        cells.forEach(cell => {
            textToCopy += cell.textContent;
        });
    } else {
        textToCopy = textOutput.textContent.trim();
    }

    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
        copyAlert.style.display = "block";

        setTimeout(() => {
            copyAlert.style.display = "none";
        }, 1000);
    }).catch(err => {
        console.error("복사 실패:", err);
    });
});

// 텍스트 저장
function saveText() {
    var text = $("#textOutput").val();

    $.ajax({
        url: "/download",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ text: text }),
        success: function() {
            window.location.href = "/static/uploads/extracted_text.txt";
        },
        error: function() {
            alert("파일 저장 중 오류가 발생했습니다.");
        }
    });
}

// 챗봇
function openChatbot() {
    window.open('/chat', '_blank');
}

// 모델 변경 팝업
document.getElementById("modelSelect").addEventListener("change", function () {
    let popup = document.getElementById("statusPopup");

    popup.innerText = "모델 변경 완료";
    popup.style.display = "block";

    setTimeout(() => {
        popup.style.display = "none";
    }, 1000);

});




