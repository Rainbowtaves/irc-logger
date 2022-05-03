const menu = document.getElementById('menu'),
    log = document.getElementById('log'),
    channelButton = document.getElementById('channelButton'),
    datePicker = document.getElementById('datepicker'),
    myInput = document.getElementById('myInput')
    autoScrollSwitch = document.getElementById('autoScrollSwitch')
let notFound =  '<div class="center text-center"><h1 style="color: #dc3545;">404 Not Found</h1><br><img src="https://cdn.discordapp.com/emojis/751824616812576818.png"/></div>'
let loading = '<div class="center"><i class="huge notched circle loading icon"></i></div>'
let stringNumber,
    channel,
    date

function hideMenu(e) {
    if (menu.offsetWidth !== 0) {
        menu.style.width = '0'
        e.style.position = 'fixed'
        e.children[0].classList.remove('left')
        e.children[0].classList.add('right')
    } else {
        menu.style.width = ''
        e.style.position = 'absolute'
        e.children[0].classList.remove('right')
        e.children[0].classList.add('left')
    }
    e.blur()
}

function changeChannel(c) {
    channel = c;
    change();
}

function changeDate(d) {
    date = d;
    stringNumber = 0;
    change();
}

function disableOnLoad(bool = true) {
    channelButton.disabled = bool
    myInput.disabled = bool
}

function change() {
    if (!channel || !date) return
    log.innerHTML = loading
    disableOnLoad()
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
            if(autoScrollSwitch.checked) log.scroll({top: log.scrollHeight})
        })
        .catch((e) => {
            console.error(e)
            log.innerHTML = notFound
        })
        .finally(() => {
            disableOnLoad(false)
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
                if (autoScrollSwitch.checked) log.scroll({top: log.scrollHeight})
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
