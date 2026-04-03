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

function updateQueryString() {
    const params = new URLSearchParams();
    if (channel) params.set('channel', channel);
    if (date) params.set('date', date);
    const search = myInput.value;
    if (search) params.set('search', search);
    history.replaceState(null, '', '?' + params.toString());
}

function changeChannel(c) {
    channel = c;
    updateQueryString();
    change();
}

function changeDate(d) {
    date = d;
    stringNumber = 0;
    updateQueryString();
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

    const urlParams = new URLSearchParams(window.location.search);
    const initChannel = urlParams.get('channel');
    const initDate = urlParams.get('date');
    if (initChannel) {
        channel = initChannel;
        channelButton.value = initChannel;
    }
    if (initDate) {
        const [y, m, d] = initDate.split('-').map(Number);
        $('#datepicker').datepicker('update', new Date(y, m - 1, d));
        changeDate(initDate);
    }

    const initSearch = urlParams.get('search');
    if (initSearch) myInput.value = initSearch;

    let lastInput = 0
    $("#myInput").keyup(function (event) {
        updateQueryString()
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

class ChannelSelector {
    constructor(input, menu) {
        this.input = input;
        this.menu = menu;
        this.dropdown = new bootstrap.Dropdown(input, { autoClose: 'outside' });

        input.addEventListener('click', () => this.dropdown.show());
        input.addEventListener('focus', () => { input.select(); this.dropdown.show(); });
        input.addEventListener('blur', () => setTimeout(() => this.dropdown.hide(), 150));
        input.addEventListener('input', () => this._filter());
        input.addEventListener('keydown', (e) => this._onKeydown(e));
        input.addEventListener('hidden.bs.dropdown', () => this._onHidden());
        menu.addEventListener('click', (e) => {
            if (e.target.classList.contains('dropdown-item')) {
                channel = e.target.textContent.trim();
                this.dropdown.hide();
            }
        }, true);
    }

    _filter() {
        this.dropdown.show();
        const query = this.input.value.replace(/^#/, '').toLowerCase();
        this.menu.querySelectorAll('.dropdown-item').forEach(item => {
            const name = item.textContent.trim().replace(/^#/, '').toLowerCase();
            item.closest('li').style.display = name.includes(query) ? '' : 'none';
        });
    }

    _onKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const firstVisible = [...this.menu.querySelectorAll('li')]
                .find(li => li.style.display !== 'none' && li.querySelector('.dropdown-item'));
            if (firstVisible) {
                channel = firstVisible.querySelector('.dropdown-item').textContent.trim();
                this.dropdown.hide();
                changeChannel(channel);
            }
        } else if (e.key === 'Escape') {
            this.dropdown.hide();
        }
    }

    _onHidden() {
        this.menu.querySelectorAll('li').forEach(li => li.style.display = '');
        this.input.value = channel || '';
    }
}

new ChannelSelector(channelButton, document.querySelector('.dropdown-menu'));
