const menu = document.getElementById('menu'),
    log = document.getElementById('log'),
    channelButton = document.getElementById('channelButton'),
    myInput = document.getElementById('myInput')
    autoScrollSwitch = document.getElementById('autoScrollSwitch')
let errorMessage =  '<div class="center text-center"><h1 style="color: #dc3545;">{{statusText}}</h1><br><iframe width="935" height="711" src="https://www.youtube.com/embed/weRHyjj34ZE" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
let loading = '<div class="center"><i class="huge notched circle loading icon"></i></div>'
let stringNumber,
    channel,
    date

function hideMenu(e) {
    menu.style.width = menu.offsetWidth !== 0 ? '0' : ''
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
        .then(r => {
            if (r.ok) {
                return r.json()
            }
            throw new Error(r.status+" "+r.statusText)
        })
        .then(data => {
            data = JSON.parse(data)
            log.innerHTML = data.html || notFound
            stringNumber = data.length;
            if(autoScrollSwitch.checked) log.scroll({top: log.scrollHeight})
        })
        .catch((e) => {
            console.error(e)
            log.innerHTML = errorMessage.replace('{{statusText}}', e.message)
        })
        .finally(() => {
            disableOnLoad(false)
        })
}

$(document).ready(function () {
    $('#datepicker').datepicker({
        format: 'dd-mm-yyyy',
        language: 'ru',
        todayHighlight: true,
        todayBtn: false
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
            .catch((e) => {
                console.error(e)
            })
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
