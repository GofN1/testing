//BN 20210128 : CR
var validationErrorIcon = "<i class='icon-remove-sign fontSize-14 fix-valign-middle fix-margin-l-5'></i>";

//BN 20210128 : CR
$(document).ready(function () {
    try {
        removeExtraParameter();
        dataModel = JSON.parse($('#dataModelHidenFiledLogin').val());

        // initial focus
        $("#txtUserName").focus();

        //default buttons
        $("#dlgRetriveData").defaultButton("#btnRetriveData");
        $("#frmLogin").defaultButton("#btnLogin");

        setupRetriveDataByEmail();
        setupLoginValidation();

        //fill intro information
        $("#spnIntro").html(dataModel.Data.Introduction);
    } catch (ex) {

    }
});

//BN 20210128 : CR
function setupRetriveDataByEmail() {//prepare form for usage

    $("#btnRetriveData").click(SendUserDataToEmail);//set call back function

    //reset form
    $("#dlgRetriveData button[data-dismiss='modal']").click(function () {
        $("#dlgRetriveData input[type!='button']").val("");
        $("#frmRetriveData").data("bootstrapValidator").resetForm();
    });

    //Initial field focus
    $("#dlgRetriveData").on("shown.bs.modal", function (e) {
        $("#txtEmailRetriveData").focus();
    });

    //validations
    $("#frmRetriveData").bootstrapValidator({
        live: "disabled",
        message: "",
        fields: {
            txtEmailRetriveData: {
                validators: {
                    notEmpty: { //Empty Email message
                        message: validationErrorIcon + "يجب ادخال البريد الإلكتروني"
                    },
                    emailAddress: {//Invalid email message
                        message: validationErrorIcon + "<span>يجب ادخال صيغة بريد إلكتروني صحيحة</span>"
                    }
                }
            }

        }
    });
    $("#frm2FAData").bootstrapValidator({
        live: "disabled",
        message: "",
        fields: {
            txt2FACodeData: {
                validators: {
                    notEmpty: { //Empty Email message
                        message: validationErrorIcon + "يجب إدخال رمز التحقق بخطوتين"
                    },
                }
            }

        }
    });
}

//BN 20210128 : CR
function SendUserDataToEmail() {
    var bootstrapValidator = $("#frmRetriveData").data("bootstrapValidator");

    //Validate fields
    bootstrapValidator.validate();

    if (bootstrapValidator.isValid()) {//If valid
        //Show message
        showProgress("جاري استرجاع معلومات الحساب...", progressMessageType.Progress, "#dlgRetriveData");

        //Send an Ajax requesting to reset password
        $.ajax({
            type: "POST",
            url: "/DataEntry/Services/Default.svc/ResetUserPassword", //Service name
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({ email: $("#txtEmailRetriveData").val() }),
            success: function (data) { //In case of successful call

                //Show a message then reset forms
                showProgressResult(data.Exception == null ? "تم إرسال معلومات الحساب بنجاح." : data.Exception, data.Exception == null ? progressMessageType.Success : progressMessageType.Error, "#dlgRetriveData", 3, function () {
                    $("#dlgRetriveData input[type!='button']").val("");
                    $("#frmRetriveData").data("bootstrapValidator").resetForm();

                    if (data.Exception == null) {
                        $("#dlgRetriveData").modal("hide");
                    }
                });
            }
        });
    }
}
function Verify2FACode() {
    var bootstrapValidator1 = $("#frm2FAData").data("bootstrapValidator");
    var btnEnter = document.getElementById('btnEnter');

    //Validate fields
    bootstrapValidator1.validate();
    var bootstrapValidator2 = $("#frmRetriveData").data("bootstrapValidator");

    //Validate fields
    bootstrapValidator2.validate();

    if (bootstrapValidator1.isValid() && bootstrapValidator2.isValid()) {//If valid
        //Show message
        showProgress("جاري إرسال رمز التحقق...", progressMessageType.Progress, "#dlg2FAData");
        btnEnter.innerHTML = 'دخول ' + '<img src="/DataEntry/Content/Images/Loading.gif " width="16px" height="16px">';

        //Send an Ajax requesting to reset password
        $.ajax({
            type: "POST",
            url: "/DataEntry/Services/Default.svc/Verify2FACode", //Service name
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({ userName: $("#txtUserName").val(), password: $("#txtPassword").val(), code: $("#txt2FACodeData").val() }),
            success: function (Data) { //In case of successful call
                $("#txt2FACodeData").val("");
                let codeField = document.getElementById('txt2FACodeData');
                codeField.value = '';
                //Show a message then reset forms
                if (Data.Exception == null) {
                    $("#dlg2FACode").modal("hide");
                    location.reload();
                }
                showProgressResult(Data.Exception == null ? "تم تسجيل الدخول الى الحساب بنجاح." : Data.Exception, Data.Exception == null ? progressMessageType.Success : progressMessageType.Error, "#dlg2FACode", 3, function () {
                    $("#txt2FACodeData").val("");
                    let codeField = document.getElementById('txt2FACodeData');
                    codeField.value = '';
                    $("#frm2FAData").data("bootstrapValidator").resetForm();
                });
                btnEnter.innerHTML = 'دخول ';

            },
            error: function (Data) {
                btnEnter.innerHTML = 'دخول ';
            },
            complete: function () {
                btnEnter.innerHTML = 'دخول ';
            }
        });
    }
}
function pressBtnEnterEvent(event) {
    if (event.key === 'Enter' || event.keyCode === 13) {
        event.preventDefault();
        Verify2FACode();
    }
}
let timerOn = true;
function timer(remaining) {
    var resendTimer = document.getElementById('resendTimer');
    var m = Math.floor(remaining / 60);
    var s = remaining % 60;

    m = m < 10 ? '0' + m : m;
    s = s < 10 ? '0' + s : s;
    
   
    remaining -= 1;
    if (remaining>0) {
        resendTimer.innerHTML = m + ':' + s;
    } else {
        resendTimer.innerHTML = '';
    }
    if (remaining >= 0 && timerOn) {
        setTimeout(function () {
            timer(remaining);
        }, 1000);
        return;
    }

    if (!timerOn) {
        // Do validate stuff here
        return;
    }
}
function Send2FACode(resend = false) {
    var bootstrapValidator = $("#frmLogin").data("bootstrapValidator");

    bootstrapValidator.validate();
    if (bootstrapValidator.isValid()) {
        //<img src="/DataEntry/Content/Images/Loading.gif " width="16px" height="16px">
        var btnLogin = document.getElementById('btnLogin');

        btnLogin.innerHTML = 'تسجيل الدخول ' + '<img src="/DataEntry/Content/Images/Loading.gif " width="16px" height="16px">';
        //Send an Ajax requesting to reset password
        $.ajax({
            type: "POST",
            url: "/DataEntry/Services/Default.svc/Send2FACode", //Service name
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({ userName: $("#txtUserName").val(), password: $("#txtPassword").val() }),
            success: function (Data) { //In case of successful call
                if (Data.Exception == null) {
                    timer(120);
                    $("#dlg2FACode").modal("show");

                    if (resend) {
                        showGenericModal("رمز التحقق:", "تم إعادة إرسال رمز التحقق بنجاح.", progressMessageType.Success, "", null);
                    }
                } else {
                    showGenericModal("خطأ :", Data.Exception, progressMessageType.Error, "", null);
                }
            },
            error: function (data) {
                btnLogin.innerHTML = 'تسجيل الدخول';
            },
            complete: function () {
                document.getElementById("txt2FACodeData").focus();
                btnLogin.innerHTML = 'تسجيل الدخول';
            }
        });
    }
}

//BN 20210128 : CR
function setupLoginValidation() {//prepare form validators
    $("#frmLogin").bootstrapValidator({
        live: "disabled",
        message: "",
        fields: {
            txtUserName: {
                selector: "#txtUserName",
                validators: {
                    notEmpty: { //Empty user name
                        message: validationErrorIcon + "يجب ادخال اسم المستخدم"
                    }
                }
            },
            txtPassword: {
                selector: "#txtPassword",
                validators: {
                    notEmpty: {//Empty password field
                        message: validationErrorIcon + "يجب ادخال كلمة السر "
                    }
                }
            }
        }
    });
}

//BN 20210128 : CR
function ValidateRetrieveData() {//validate email
    var bootstrapValidator = $("#frmLogin").data("bootstrapValidator");

    bootstrapValidator.validate();

    return bootstrapValidator.isValid();
}

//BN 20210128 : CR
function removeExtraParameter() {//seems that it removes any extra parameteres in the URL, protection

    var urlParameter = window.location.search;
    urlParameter = urlParameter.split("%26"); //&
    if (urlParameter.length == 2) {
        window.location.assign(urlParameter[0]);
    }
}
