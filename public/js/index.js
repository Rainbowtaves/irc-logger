var log = document.getElementById('log')
var autoScrollCheck = document.getElementById('autoScrollCheck')
var notFound =  '<center><h1><font color=#FF0000>404 Not Found</font></h1><br><img src="https://cdn.discordapp.com/emojis/751824616812576818.png"></img></center>'
var stringNumber,
    channel,
    date

function changeChannel(c) {
    channel = c;
    change();
}

function changeDate(d) {
    date = d;
    stringNumber = 0;
    change();
}

function change() {
    if (!channel || !date) return
    $.ajax({
        url: 'getlog',
        method: 'post',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            channel: channel,
            date: date,
            search: document.getElementById("myInput").value
        }),
        success: function (data) {
            data = JSON.parse(data)
            log.innerHTML = data.html || notFound
            stringNumber = data.length;
            if(autoScrollCheck.checked) window.scroll({top: log.scrollHeight})
        },
        error: function (data) {
            log.innerHTML = notFound
        }
    })

}

$(document).ready(function () {
    $('#datepicker').datepicker({
        format: 'dd-mm-yyyy',
        language: 'ru',
        todayHighlight: true
    });

    $("#datepicker").on("changeDate", function (event) {
        var formattedDate = $("#datepicker").datepicker('getFormattedDate').split('-');
        isoDate = formattedDate[2] + "-" + formattedDate[1] + "-" + formattedDate[0];
        changeDate(isoDate);
    });

    var lastInput = 0
    $("#myInput").keyup(function (event) {
        clearTimeout(lastInput)
        lastInput = setTimeout(() => change(), 1000)
    })

    setInterval(newLineChecker, 10000);

    function newLineChecker() {
        if (!channel || !date) return
        $.ajax({
            url: 'check',
            method: 'post',
            contentType: 'application/json',
            data: JSON.stringify({
                channel: channel,
                date: date
            }),
            success: function (data) {
                if (stringNumber < data) {
                    getChangedData();
                }
            },
            error: function (e) {
                console.error(e)
            }
        })
    }

    function getChangedData() {
        $.ajax({
            url: 'getlog',
            method: 'post',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify({
                channel: channel,
                date: date,
                search: document.getElementById("myInput").value,
                offset: stringNumber
            }),
            success: function (data) {
                data = JSON.parse(data)
                log.innerHTML += data.html
                stringNumber = data.length;
                if(autoScrollCheck.checked) window.scroll({top: log.scrollHeight})
            }
        })
    }
})

$(function () {
    $(".dropdown-menu li a").click(function () {
        $(".btn:first-child").text($(this).text());
        $(".btn:first-child").val($(this).text());
    });
});