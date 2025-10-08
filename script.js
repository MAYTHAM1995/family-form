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
        // حذف بطاقة المستفيد
        if (event.target && event.target.classList.contains('remove-btn')) {
            const card = event.target.closest('.beneficiary-card');
            if (card) {
                card.remove();
            }
        }
    });

    // --- منطق التحكم في تفاصيل السكن (داخل كل بطاقة) ---
    beneficiariesContainer.addEventListener('change', function(event) {
        if (event.target && event.target.classList.contains('housing-type')) {
            const card = event.target.closest('.beneficiary-card');
            const selectedValue = event.target.value;
            
            const detailsContainer = card.querySelector('.housing-details-container');
            const allDetailDivs = detailsContainer.querySelectorAll('.form-group');

            // إخفاء كل التفاصيل أولاً
            allDetailDivs.forEach(div => div.classList.add('hidden'));

            // إظهار التفاصيل المطابقة للاختيار
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
        let classificationClass = '';

        if (netIncome < 0) {
            classification = 'وضع حرج جداً (عجز مالي)';
            classificationClass = 'status-critical';
        } else if (netIncome <= 250000) {
            classification = 'وضع صعب (تغطية بالكاد)';
            classificationClass = 'status-difficult';
        } else if (netIncome <= 600000) {
            classification = 'وضع مستقر (فائض بسيط)';
            classificationClass = 'status-stable';
        } else {
            classification = 'وضع جيد (فائض جيد)';
            classificationClass = 'status-good';
        }

        // 3. عرض التقرير
        const reportSection = document.getElementById('reportSection');
        document.getElementById('reportClassification').textContent = classification;
        document.getElementById('reportClassification').className = classificationClass;
        
        document.getElementById('reportTotalIncome').textContent = totalIncome.toLocaleString() + ' دينار عراقي';
        document.getElementById('reportTotalExpenses').textContent = totalExpenses.toLocaleString() + ' دينار عراقي';
        
        const netIncomeSpan = document.getElementById('reportNetIncome');
        netIncomeSpan.textContent = netIncome.toLocaleString() + ' دينار عراقي';
        netIncomeSpan.style.color = netIncome < 0 ? 'red' : 'green';

        const fullName = document.getElementById('fullName').value;
        document.getElementById('reportSummaryText').textContent = `هذا التقرير خاص بأسرة المضحي "${fullName}".`;
        
        reportSection.classList.remove('hidden');
        reportSection.scrollIntoView({ behavior: 'smooth' });
    });

    // إضافة وظيفة لزر الطباعة
    document.getElementById('printButton').addEventListener('click', function() {
        window.print();
    });

});