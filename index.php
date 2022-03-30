<!DOCTYPE html>
<html>
	<head>
		<title>[β]Rainbowtaves' Logs</title>
		<meta content="text/html;charset=utf-8" http-equiv="Content-Type">
		<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
		<link rel="icon" type="image/png" href="favicon.png" />
		<link rel="stylesheet" type="text/css" href="css/semanticUI/semantic.min.css">
        <link rel="stylesheet" type="text/css" href="css/bootstrap-datepicker.min.css">
        <link rel="stylesheet" type="text/css" href="css/bootstrap.min.css">
        <link rel="stylesheet" type="text/css" href="css/bootstrap-theme.min.css">
		<link rel="stylesheet" type="text/css" href="css/styles.css">
		<!--<script src="js/ny.js"></script>-->

	</head>

	<body style="background-color: #0E0E0E">
		<div>
			<div>
				<div class="affix" style="float: left; height: 100%; background-color: #171717; overflow: auto">	
					<br>
					<h2 class="ui center aligned icon header">
						<font color="#FFFFFF">
	  					<i class="ui grey inverted circular archive icon"></i>
	  					Logs<font size="1px"> β</font>
	  					</font>
					</h2>

					<p class="text-center"><font color="#FFF"><b>Server timezone:</b><br>Europe/Moscow (UTC +3)    </font></p>

						<center>
							<div class="ui inverted divider"></div>
							<div class="btn-group dropdown">
								<!-- There's button which contains dropdown channel menu -->
								<button type="button" title="Select channel from list below and pick date. TIP: You can refresh log file without refreshing page, just click on the date again." class="btn btn-primary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
								<i class="icon hashtag"></i>
								Select channel
								<i class="icon chevron down"></i>
								</button>


								<!-- There is a selection menu with channels which should be reworked -->
								<!-- (08.01.2022) [11:59:18] <@Kobold84> Сделай выбор чаннел листа попроще, обычным дропменю. -->
								  <ul class="dropdown-menu dropdown-menu-right scrollable-menu" role="menu">
									<?php
									foreach(glob('logs/*', GLOB_ONLYDIR) as $dir) {
										$dir = str_replace('logs/', '', $dir);
										echo "<li class=\"item\"><a tabindex=\"-1\" data-target=\"#\" data-toggle=\"pill\" href=\"#\" onclick=\"changeChannel('$dir')\">$dir</a></li>";
									}
									?>
								  </ul>

							</div>
						</center><br>
						<center>
							<div class="ui inverted left icon input">
								<input type="search" id="myInput" onkeyup="change()" placeholder="Search..">
								<i class="search icon"></i>
							</div>
						</center>
					
						<center><div id="datepicker" style="clear: both; color: #fff"></div></center>
						<!--suppress CssInvalidPropertyValue -->
                    <p style="position: top; bottom:8px"><center>
							<div class="ui inverted divider"></div>
							<font color = "#fff">© 2020 - <?php $year = date("Y"); echo $year?><br><a class="ui orange image label" href="https://rainbowtaves.ru"><img src="https://a.ppy.sh/10079847?1646391845.jpeg"></img>Rainbowtaves</a><br>
								<div class="ui icon message">
									<font size="5px"><i class="hdd outline icon"></i></font>
									<div class="content">
									<div class="header"> Remaining space</div>
										<p>
										<?php
										$df = disk_free_space("/");
										$dt = disk_total_space("/");

										function getSymbolByQuantity($bytes) {
										    $symbols = array('B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB');
										    $exp = floor(log($bytes)/log(1024));

										    return sprintf('%.2f '.$symbols[$exp], ($bytes/pow(1024, floor($exp))));
										}

										echo(getSymbolByQuantity($df)." / ".getSymbolByQuantity($dt));
										?></p></div></div>
										Thanks <a class="ui image label" href="https://osu.ppy.sh/users/10113201"><img src="https://a.ppy.sh/10113201?1645791952.jpeg"></img>Bullet4fun</a>, <br><a class="ui image label" href="https://osu.ppy.sh/users/672931"><img src="https://a.ppy.sh/672931?1628634992.png"></img>TicClick</a> and <a class="ui image label" href="https://reyie.com"><img src="https://a.ppy.sh/1896725?1485003191.png"></img>Rey</a><br> for helping me fill the<br> site with logs.<br><br><br>
								<button onclick="window.location.href='https://streamelements.com/rainbowtaves/tip'" class="ui inverted green button" type="button"><font size="3px"><i class="icon money bill alternate outline"></i> Donate</font></button></center></font><br>
						</p>
				</div>

			</div>

		<div id="log" style="float: left; width: 85%; background-color: #0E0E0E; color: #FFF; word-wrap: break-word"><center><h1>Choose channel and date</h1></center>
		</div>
		</div>
		<center>

		<script src="js/jquery-1.11.3.min.js"></script>
		<script src="https://code.jquery.com/jquery-3.1.1.min.js" integrity="sha256-hVVnYaiADRTO2PzUGmuLJr8BLUSjGIZsDYGmIJLv2b8=" crossorigin="anonymous"></script>
		<script src="css/semanticUI/semantic.min.js"></script>
		<script src="js/jquery-ui.min.js"></script>
		<script src="js/bootstrap.min.js"></script>
		<script src="js/bootstrap-datepicker.min.js"></script>
		<!--<script src="js/bootstrap-datepicker.pl.min.js"></script>-->
		
		<script>
		function changeChannel(c) {
			channel=c;
			change();
		}
		
		$(function(){
		  
				  $(".dropdown-menu li a").click(function(){
				    
				    $(".btn:first-child").text($(this).text());
				     $(".btn:first-child").val($(this).text());
				  });

				});


		function changeDate(d) {
			date=d;
			change();
		}
		
		function change() {
			var http = new XMLHttpRequest();
			http.open("POST", "getlog.php", true);
			http.setRequestHeader("Content-type","application/x-www-form-urlencoded");
			var params = "channel=" + channel + "&date=" + date + "&search=" + document.getElementById("myInput").value; // probably use document.getElementById(...).value
			http.send(params);
			http.onload = function() {
				document.getElementById('log').innerHTML  = http.responseText;
			}
		}
		
		$(document).ready( function(){
			$('#datepicker').datepicker({
				format: 'dd-mm-yyyy',
				language: 'ru',
				todayHighlight: true
			});

			$("#datepicker").on("changeDate", function(event) {
				var formattedDate = $("#datepicker").datepicker('getFormattedDate').split('-');
				isoDate = formattedDate[2] + "-" + formattedDate[1]  + "-" + formattedDate[0];
				changeDate(isoDate);
			});		
		});
		</script>
		<script>
		function myFunction() {
		    var input, filter, ul, li, a, i, txtValue;
		    input = document.getElementById("myInput");
		    filter = input.value.toUpperCase();
		    ul = document.getElementById("log").innerHTML = text;
		    for (i = 0; i < ul.length; i++) {
		        a = ul[i].getElementsByTagName("a")[0];
		        txtValue = a.textContent || a.innerText;
		        if (txtValue.toUpperCase().indexOf(filter) > -1) {
		            ul[i].style.display = "";
		        } else {
		            ul[i].style.display = "none";
		        }
		    }
		}
		</script>
		<script>
			$('.example .menu .browse')
			  .popup({
			    inline     : true,
			    hoverable  : true,
			    position   : 'bottom left',
			    delay: {
			      show: 300,
			      hide: 800
			    }
			  })
			;
		</script>
		</center>

	</body>
</html>