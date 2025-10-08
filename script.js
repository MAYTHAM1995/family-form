document.addEventListener('DOMContentLoaded', function() {
    // --- تعريف عناصر التحكم الرئيسية ---
    const victimMaritalStatus = document.getElementById('victimMaritalStatus');
    const fatherStatus = document.getElementById('fatherStatus');
    const motherStatus = document.getElementById('motherStatus');
    const parentsMaritalStatusWrapper = document.getElementById('parentsMaritalStatusWrapper');
    const parentsMaritalStatus = document.getElementById('parentsMaritalStatus');
    const parentsStatusNote = document.getElementById('parentsStatusNote');
    
    // --- تعريف الحاويات المالية الثابتة ---
    const combinedFinancials = document.getElementById('combinedFinancials');
    const separatedFinancials = document.getElementById('separatedFinancials');
    const survivorFinancials = document.getElementById('survivorFinancials');
    const spouseSection = document.getElementById('spouseSection');

    // --- ربط الأحداث مع العناصر ---
    victimMaritalStatus.addEventListener('change', updateFormVisibility);
    fatherStatus.addEventListener('change', updateFormVisibility);
    motherStatus.addEventListener('change', updateFormVisibility);
    parentsMaritalStatus.addEventListener('change', updateFormVisibility);

    // --- الدالة الرئيسية لتحديث واجهة الفورم ---
    function updateFormVisibility() {
        hideAllFinancialSections();

        const isFatherAlive = fatherStatus.value === 'حي';
        const isMotherAlive = motherStatus.value === 'حية';

        // منطق الزوجة
        if (victimMaritalStatus.value === 'متزوج') {
            spouseSection.classList.remove('hidden');
        }

        // منطق الوالدين
        if (!isFatherAlive && !isMotherAlive) {
            parentsStatusNote.innerText = 'الحالة الاجتماعية للوالدين: متوفيان';
            parentsStatusNote.classList.remove('hidden');
        } else if (isFatherAlive && !isMotherAlive) {
            showSurvivorFinancials('الأب', 'ارمل');
        } else if (!isFatherAlive && isMotherAlive) {
            showSurvivorFinancials('الأم', 'ارملة');
        } else if (isFatherAlive && isMotherAlive) {
            parentsMaritalStatusWrapper.classList.remove('hidden');
            const status = parentsMaritalStatus.value;
            if (status === 'مجتمعين') {
                combinedFinancials.classList.remove('hidden');
            } else if (status === 'منفصلين') {
                separatedFinancials.classList.remove('hidden');
            }
        }
    }

    function hideAllFinancialSections() {
        spouseSection.classList.add('hidden');
        parentsMaritalStatusWrapper.classList.add('hidden');
        combinedFinancials.classList.add('hidden');
        separatedFinancials.classList.add('hidden');
        survivorFinancials.classList.add('hidden');
        parentsStatusNote.classList.add('hidden');
    }
    
    function showSurvivorFinancials(survivor, status) {
        parentsStatusNote.innerText = `الحالة الاجتماعية للوالدين: ${status}`;
        parentsStatusNote.classList.remove('hidden');
        const legend = survivorFinancials.querySelector('legend');
        legend.innerText = `3. الحالة المادية لـ ${survivor}`;
        survivorFinancials.innerHTML = `
            <legend>${legend.innerText}</legend>
            <div class="form-group"><label>اسم المستفيد (${survivor}):</label><input type="text" placeholder="اسم ${survivor} الكامل"></div>
            <div class="form-group"><label>إجمالي دخل ${survivor}:</label><input type="number" placeholder="الدخل الشهري لـ ${survivor}"></div>
            <div class="form-group"><label>إجمالي مصاريف ${survivor}:</label><input type="number" placeholder="المصاريف الشهرية لـ ${survivor}"></div>
        `;
        survivorFinancials.classList.remove('hidden');
    }
    
    // --- منطق "مستفيدون آخرون" ---
    const addOtherBeneficiaryBtn = document.getElementById('addOtherBeneficiaryBtn');
    const otherBeneficiariesContainer = document.getElementById('otherBeneficiariesContainer');
    const otherBeneficiaryTemplate = document.getElementById('otherBeneficiaryTemplate');

    addOtherBeneficiaryBtn.addEventListener('click', function() {
        const templateContent = otherBeneficiaryTemplate.content.cloneNode(true);
        otherBeneficiariesContainer.appendChild(templateContent);
    });

    otherBeneficiariesContainer.addEventListener('click', function(event) {
        if (event.target && event.target.classList.contains('remove-btn')) {
            event.target.closest('.beneficiary-card').remove();
        }
    });

    // --- التعامل مع إرسال الفورم وربطه بـ Google Sheets ---
    document.getElementById('victimInfoForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.textContent = 'جاري الإرسال...';
        submitButton.disabled = true;
        
        let totalIncome = 0;
        let totalExpenses = 0;
        const getNumber = (element) => element ? parseFloat(element.value) || 0 : 0;

        // 1. جمع البيانات من الأقسام الثابتة
        if (!combinedFinancials.classList.contains('hidden')) {
            totalIncome += getNumber(combinedFinancials.querySelector('input[type="number"]:nth-of-type(1)'));
            totalExpenses += getNumber(combinedFinancials.querySelector('input[type="number"]:nth-of-type(2)'));
        }
        if (!separatedFinancials.classList.contains('hidden')) {
            totalIncome += getNumber(separatedFinancials.querySelector('fieldset:nth-of-type(1) input[type="number"]'));
            totalExpenses += getNumber(separatedFinancials.querySelector('fieldset:nth-of-type(1) input[type="number"]:nth-of-type(2)'));
            totalIncome += getNumber(separatedFinancials.querySelector('fieldset:nth-of-type(2) input[type="number"]'));
            totalExpenses += getNumber(separatedFinancials.querySelector('fieldset:nth-of-type(2) input[type="number"]:nth-of-type(2)'));
        }
        if (!survivorFinancials.classList.contains('hidden')) {
            totalIncome += getNumber(survivorFinancials.querySelector('input[type="number"]:nth-of-type(1)'));
            totalExpenses += getNumber(survivorFinancials.querySelector('input[type="number"]:nth-of-type(2)'));
        }
        if (!spouseSection.classList.contains('hidden')) {
            totalIncome += getNumber(spouseSection.querySelector('input[type="number"]'));
        }

        // 2. جمع البيانات من قسم "مستفيدون آخرون"
        const otherBeneficiaryCards = otherBeneficiariesContainer.querySelectorAll('.beneficiary-card');
        otherBeneficiaryCards.forEach(card => {
            totalIncome += getNumber(card.querySelector('.beneficiary-income'));
            totalExpenses += getNumber(card.querySelector('.beneficiary-expenses'));
        });
        
        // 3. حساب وتصنيف
        const netIncome = totalIncome - totalExpenses;
        let classification = '';
        if (netIncome < 0) { classification = 'وضع حرج جداً (عجز مالي)'; }
        else if (netIncome <= 250000) { classification = 'وضع صعب (تغطية بالكاد)'; }
        else if (netIncome <= 600000) { classification = 'وضع مستقر (فائض بسيط)'; }
        else { classification = 'وضع جيد (فائض جيد)'; }

        // 4. تجهيز البيانات للإرسال إلى Google Sheet
        const dataToSubmit = {
            FullName: document.getElementById('fullName').value,
            MaritalStatus: document.getElementById('victimMaritalStatus').value,
            TotalIncome: totalIncome,
            TotalExpenses: totalExpenses,
            NetIncome: netIncome,
            Classification: classification,
        };

        // 5. إرسال البيانات
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
        document.getElementById('reportTotalIncome').textContent = data.TotalIncome.toLocaleString() + ' دينار';
        document.getElementById('reportTotalExpenses').textContent = data.TotalExpenses.toLocaleString() + ' دينار';
        const netIncomeSpan = document.getElementById('reportNetIncome');
        netIncomeSpan.textContent = data.NetIncome.toLocaleString() + ' دينار';
        netIncomeSpan.style.color = data.NetIncome < 0 ? 'red' : 'green';
        document.getElementById('reportSummaryText').textContent = `هذا التقرير خاص بأسرة المضحي "${data.FullName}".`;
        
        reportSection.classList.remove('hidden');
        reportSection.scrollIntoView({ behavior: 'smooth' });
    }

    // إضافة وظيفة لزر الطباعة
    document.getElementById('printButton').addEventListener('click', () => window.print());

    // استدعاء الدالة أول مرة عند تحميل الصفحة
    updateFormVisibility();
});
