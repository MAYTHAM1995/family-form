document.addEventListener('DOMContentLoaded', function() {
    
    // --- منطق التحكم في إضافة وحذف المستفيدين ---
    const addBeneficiaryBtn = document.getElementById('addBeneficiaryBtn');
    const beneficiariesContainer = document.getElementById('beneficiariesContainer');
    const beneficiaryTemplate = document.getElementById('beneficiaryTemplate');

    addBeneficiaryBtn.addEventListener('click', function() {
        const templateContent = beneficiaryTemplate.content.cloneNode(true);
        beneficiariesContainer.appendChild(templateContent);
    });

    beneficiariesContainer.addEventListener('click', function(event) {
        if (event.target && event.target.classList.contains('remove-btn')) {
            event.target.closest('.beneficiary-card').remove();
        }
    });

    // --- منطق التحكم في تفاصيل السكن (داخل كل بطاقة) ---
    beneficiariesContainer.addEventListener('change', function(event) {
        if (event.target && event.target.classList.contains('housing-type')) {
            const card = event.target.closest('.beneficiary-card');
            const selectedValue = event.target.value;
            const detailsContainer = card.querySelector('.housing-details-container');
            const allDetailDivs = detailsContainer.querySelectorAll('.form-group');
            allDetailDivs.forEach(div => div.classList.add('hidden'));
            if (selectedValue) {
                const detailToShow = detailsContainer.querySelector(`[data-housing-detail="${selectedValue}"]`);
                if (detailToShow) {
                    detailToShow.classList.remove('hidden');
                }
            }
        }
    });

    // --- التعامل مع إرسال الفورم وجمع البيانات ---
    document.getElementById('victimInfoForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.textContent = 'جاري الإرسال...';
        submitButton.disabled = true;
        
        // 1. جمع البيانات المالية من كل بطاقات المستفيدين
        let totalIncome = 0;
        let totalExpenses = 0;
        const beneficiaryCards = beneficiariesContainer.querySelectorAll('.beneficiary-card');
        beneficiaryCards.forEach(card => {
            const income = parseFloat(card.querySelector('.beneficiary-income').value) || 0;
            const expenses = parseFloat(card.querySelector('.beneficiary-expenses').value) || 0;
            totalIncome += income;
            totalExpenses += expenses;
        });
        
        // 2. حساب المؤشرات والتصنيف
        const netIncome = totalIncome - totalExpenses;
        let classification = '';
        if (netIncome < 0) { classification = 'وضع حرج جداً (عجز مالي)'; }
        else if (netIncome <= 250000) { classification = 'وضع صعب (تغطية بالكاد)'; }
        else if (netIncome <= 600000) { classification = 'وضع مستقر (فائض بسيط)'; }
        else { classification = 'وضع جيد (فائض جيد)'; }

        // 3. [جديد] تجهيز البيانات للإرسال إلى Google Sheet
        const dataToSubmit = {
            FullName: document.getElementById('fullName').value,
            MaritalStatus: document.getElementById('victimMaritalStatus').value,
            TotalIncome: totalIncome,
            TotalExpenses: totalExpenses,
            NetIncome: netIncome,
            Classification: classification,
        };

        // 4. [جديد] إرسال البيانات
        const googleScriptURL = "https://script.google.com/macros/s/AKfycbyuO8cwYicgRomcEqYQH-fLO-r9hZePqngmMEBCmqYSs8SyWBySQJhcfzNFPZlP_sUW/exec"; // <---!! الصق الرابط هنا !!

        fetch(googleScriptURL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: new URLSearchParams(dataToSubmit).toString()
        })
        .then(() => {
            console.log("Data sent successfully");
            displayReport(dataToSubmit); // عرض التقرير محلياً
        })
        .catch(err => {
            console.error("Error sending data:", err);
            alert("حدث خطأ أثناء إرسال البيانات، لكن سيتم عرض التقرير محلياً.");
            displayReport(dataToSubmit); // عرض التقرير حتى لو فشل الإرسال
        })
        .finally(() => {
            submitButton.textContent = 'عرض التقرير';
            submitButton.disabled = false;
        });
    });

    // دالة منفصلة لعرض التقرير
    function displayReport(data) {
        let classificationClass = '';
        if (data.NetIncome < 0) { classificationClass = 'status-critical'; }
        else if (data.NetIncome <= 250000) { classificationClass = 'status-difficult'; }
        else if (data.NetIncome <= 600000) { classificationClass = 'status-stable'; }
        else { classificationClass = 'status-good'; }

        const reportSection = document.getElementById('reportSection');
        document.getElementById('reportClassification').textContent = data.Classification;
        document.getElementById('reportClassification').className = classificationClass;
        document.getElementById('reportTotalIncome').textContent = data.TotalIncome.toLocaleString() + ' دينار عراقي';
        document.getElementById('reportTotalExpenses').textContent = data.TotalExpenses.toLocaleString() + ' دينار عراقي';
        const netIncomeSpan = document.getElementById('reportNetIncome');
        netIncomeSpan.textContent = data.NetIncome.toLocaleString() + ' دينار عراقي';
        netIncomeSpan.style.color = data.NetIncome < 0 ? 'red' : 'green';
        document.getElementById('reportSummaryText').textContent = `هذا التقرير خاص بأسرة المضحي "${data.FullName}".`;
        
        reportSection.classList.remove('hidden');
        reportSection.scrollIntoView({ behavior: 'smooth' });
    }

    // إضافة وظيفة لزر الطباعة
    document.getElementById('printButton').addEventListener('click', () => window.print());

});

