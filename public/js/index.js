let log = document.getElementById('log')
let autoScrollCheck = document.getElementById('autoScrollCheck')
let notFound =  '<center><h1><font color=#FF0000>404 Not Found</font></h1><br><img src="https://cdn.discordapp.com/emojis/751824616812576818.png"/></center>'
let stringNumber,
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
    fetch('getlog', {
        method: 'post',
        headers: {
            "Content-Type": 'application/json'
        },
        body: JSON.stringify({
            channel: channel,
            date: date,
            search: document.getElementById("myInput").value
        })
    })
        .then(r => r.json())
        .then(data => {
            data = JSON.parse(data)
            log.innerHTML = data.html || notFound
            stringNumber = data.length;
            if(autoScrollCheck.checked) window.scroll({top: log.scrollHeight})
        })
        .catch((e) => {
            console.error(e)
            log.innerHTML = notFound
        })
}

$(document).ready(function () {
    $('#datepicker').datepicker({
        format: 'dd-mm-yyyy',
        language: 'ru',
        todayHighlight: true
    });

    $("#datepicker").on("changeDate", function (event) {
        let formattedDate = $("#datepicker").datepicker('getFormattedDate').split('-');
        let isoDate = formattedDate[2] + "-" + formattedDate[1] + "-" + formattedDate[0];
        changeDate(isoDate);
    });

    let lastInput = 0
    $("#myInput").keyup(function (event) {
        clearTimeout(lastInput)
        lastInput = setTimeout(() => change(), 1000)
    })

    setInterval(newLineChecker, 10000);

    function newLineChecker() {
        if (!channel || !date) return
        fetch('check', {
            method: 'post',
            headers: {
                "Content-Type": 'application/json'
            },
            body: JSON.stringify({
                channel: channel,
                date: date
            })
        })
            .then(async r => r.text())
            .then(data => {
                if (stringNumber < data) {
                    getChangedData();
                }
            })
            .catch(console.error)
    }

    function getChangedData() {
        fetch('getlog', {
            method: 'post',
            headers: {
                "Content-Type": 'application/json'
            },
            body: JSON.stringify({
                channel: channel,
                date: date,
                search: document.getElementById("myInput").value,
                offset: stringNumber
            })
        })
            .then(r => r.json())
            .then(data => {
                data = JSON.parse(data)
                $("#log").append(data.html)
                stringNumber = data.length;
                if(autoScrollCheck.checked) window.scroll({top: log.scrollHeight})
            })
            .catch(console.error)
    }
})

$(function () {
    $(".dropdown-menu li a").click(function () {
        $(".btn:first-child").text($(this).text());
        $(".btn:first-child").val($(this).text());
    });
});