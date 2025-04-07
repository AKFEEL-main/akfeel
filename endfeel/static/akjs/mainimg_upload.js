document.addEventListener("DOMContentLoaded", function () {
    // console.log("HTML 로드 완료");

    let blankBtn = document.getElementById("blankBtn");
    let linedBtn = document.getElementById("linedBtn");
    let gridBtn = document.getElementById("gridBtn");
    let textOutput = document.getElementById("textOutput");
    let saveAlert = document.getElementById("saveAlert");
    let fileInput = document.getElementById("fileInput");
    let dropbox = document.getElementById("dropArea");
    let imagePreview = document.getElementById("imagePreview");
    let imgText = document.getElementById("imgText");
    let imgReBtn = document.getElementById("imgReBtn");
    let saveBtn = document.querySelector(".save-btn");

    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    let uploadedFile = null;
    // 기본 스타일 --> 원고지
    let currentStyle = "grid";

    function formatTextInline(text) {
        return text.replace(/\n/g, "").trim();
    }

    // 백지 버튼 클릭 시 --> 글자 붙이기
    blankBtn.addEventListener("click", function () {
        currentStyle = "blank";
        textOutput.className = "blank";
        textOutput.textContent = formatTextInline(textOutput.textContent);
    });

    // 유선지 버튼 클릭 시 --> 글자 붙이기
    linedBtn.addEventListener("click", function () {
        currentStyle = "lined";
        textOutput.className = "lined";
        textOutput.textContent = formatTextInline(textOutput.textContent);
    });

    // 원고지
    gridBtn.addEventListener("click", function () {
        currentStyle = "grid";
        textOutput.className = "grid";
        displayOCRResult(textOutput.textContent);
    });

    function displayOCRResult(text) {
        textOutput.innerHTML = "";
        // text = text.replace(/\s/g, "");
        let maxCells = 100;

        for (let i = 0; i < maxCells; i++) {
            let cell = document.createElement("div");
            cell.classList.add("og-cell");
            cell.textContent = text[i] || "";
            textOutput.appendChild(cell);
        }
    }

    document.getElementById("uploadImage").addEventListener("click", function () {
        // console.log("파일업로드 버튼 클릭");
    
        if (!uploadedFile) {
            alert("파일을 선택해주세요.");
            return;
        }
    
        let formData = new FormData();
        formData.append("file", uploadedFile);
    
        let modelType = document.getElementById("modelSelect").value;  
        formData.append("model_type", modelType);
    
        textOutput.innerHTML = "";
    
        fetch("/upload", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // console.log("파일 업로드 성공:", data);
            let cleanText = (typeof data.text !== "undefined") 
                ? data.text.replaceAll(" ", "\u00A0") 
                : "변환 실패";
        
            textOutput.innerHTML = cleanText;

            if (currentStyle === "grid") {
                displayOCRResult(cleanText);
            } else {
                textOutput.className = currentStyle;
                textOutput.textContent = cleanText;
            }
        })
        .catch(error => {
            console.error("요청 실패:", error);
            alert(`파일 업로드 중 오류 발생 : ${error.message}`);
        });
    });
    
    imgReBtn.addEventListener("click", function (e) {
        e.preventDefault();
        imagePreview.src = "";
        imagePreview.style.display = "none";
        imgText.style.display = "block";
        fileInput.value = "";
        uploadedFile = null;
        textOutput.innerHTML = "";
        currentStyle = "grid";
        textOutput.className = "grid";
    });

    dropbox.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropbox.classList.add("dragover");
    });

    dropbox.addEventListener("dragleave", () => {
        dropbox.classList.remove("dragover");
    });

    dropbox.addEventListener("drop", (e) => {
        e.preventDefault();
        dropbox.classList.remove("dragover");

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image")) {
            uploadedFile = file;
            displayImage(file);
        }
    });

    dropbox.addEventListener("click", () => {
        fileInput.value = "";
        fileInput.click();
    });

    fileInput.addEventListener("change", () => {
        if (fileInput.files.length > 0) {
            uploadedFile = fileInput.files[0];
            displayImage(fileInput.files[0]);
        }
    });

    function displayImage(file) {
        const reader = new FileReader();
        reader.onload = () => {
            imagePreview.src = reader.result;
            imagePreview.style.display = "block";
            imgText.style.display = "none";
        };
        reader.readAsDataURL(file);
    }

    saveBtn.addEventListener("click", function (event) {
        event.preventDefault();
        let textToSave = "";

        if (currentStyle === "grid") {
            let cells = textOutput.querySelectorAll(".og-cell");
            cells.forEach(cell => {
                textToSave += cell.textContent;
            });
        } else {
            textToSave = textOutput.textContent.trim();
        }

        if (!textToSave) return;

        let blob = new Blob([textToSave], { type: "text/plain" });
        let link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "akfeel텍스트변환결과.txt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        saveAlert.style.display = "block";

        setTimeout(() => {
            saveAlert.style.display = "none";
        }, 1000);
    });
});
