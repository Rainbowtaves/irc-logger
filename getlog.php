<?php
	//print_r($_POST);
	$channel = $_POST["channel"];
	$date = $_POST["date"];
	$search = $_POST['search'];
	$baselink = readlink('logs');
	$filename = "$baselink/$channel/$date.log";
	$response = array();

function lines1($filename)
{
	// в начале ищем сам файл. Может быть, путь к нему был некорректно указан
	if (!file_exists($filename)) exit("Файл не найден");

	// рассмотрим файл как массив
	$file_arr = file($filename);
	// подсчитываем количество строк в массиве
	$lines = count($file_arr);
	// вывод результата работы функции
	return $lines;
}
function lines($filename)
{
	$output=null;
	$retval=null;
	$command = 'wc -l '.$filename;
	$length = explode(
		" ",
		exec(
			$command,
			$output,
			$retval)
	);
	return $length[0];
}
$response ['lenght'] = lines($filename);
//echo $response;
	$logfile = fopen($filename, "r") or
	die("<center><h1><font color=#FF0000>404 Not Found</font></h1><br><img src=\"https://cdn.discordapp.com/emojis/751824616812576818.png\"></img></center>");
		$html = '';
		$regex_nick = '/\<[ \+\@][^\>]+\>/';
		$regex_timestamp = '/^[0-9]{2}:[0-9]{2}/';
		$regex_govnocode = "/^[0-9]{1}:[0-9]{2}:[0-9]{2}/";

		while (!feof($logfile)) {
			$line = fgets($logfile);
			//skip irssi notifications
			$pos = strpos($line, "-!- Irssi:");
			if ($pos !== false) {
				continue;
			}
			//define header containing timestamp and nick
			preg_match($regex_timestamp, $line, $matches);
			$timestamp = $matches[0];
			preg_match($regex_nick, $line, $matches, PREG_OFFSET_CAPTURE);
			$nick = $matches[0][0];
			$nick = str_replace(" ", "", $nick);
			$pos_start_content = $matches[0][1] + strlen($nick) + 1;
			//define content message
			$content = substr($line, $pos_start_content);
			if (!empty($search)) {
				if (!strpos(strtolower($line), strtolower($search))) {
					continue;
				}
			}

			$content = preg_replace($regex_govnocode, "", $content);

			//print output
			$html .=  '<span class="timestamp">' . htmlspecialchars($timestamp) . '</span> ';
			if (strpos($nick, "@")) {
				$html .= "<img width=14px height=14px title=\"Global Moderator\" src=icons/gmt.svg></img> <b><font color=\"#db3d03\">{$nick}</font></b> ";
			} elseif (strpos($nick, "Rainbowtaves")) {
				$html .=  "<img width=14px height=14px title=\"Verified User, Host of this site\" src=icons/verified.png></img> <b><font color=\"#0084FF\">" . htmlspecialchars($nick) . "</font></b> ";
			} elseif (strpos($nick, "Bullet4fun")) {
				$html .=  "<img width=14px height=14px title=\"Verified User\" src=icons/verify.svg></img> <b><font color=\"#c00fff\">" . htmlspecialchars($nick) . "</font></b> ";
			} elseif (strpos($nick, "BanchoBot")) {
				$html .=  "<img width=14px height=14px title=\"Chat Bot\" src=icons/bot.svg></img> <b><font color=\"#FF007E\">" . htmlspecialchars($nick) . "</font></b> ";
			} elseif (strpos($nick, "+")) {
				$html .=  "<img width=14px height=14px title=\"Voiced Member (IRC)\" src=icons/voice.svg></img> <b><font color=\"#ffdf2e\">" . htmlspecialchars($nick) . "</font></b> ";
			} else {
				$html .=  '<span class="nick">' . htmlspecialchars($nick) . '</span> ';
			}
			if (strpos($content, "-!-")) {
				$html .=  '<span class="content"> <b><font color=#474747>[IRC Notification]</b>' . htmlspecialchars($content) . '</font></span> ';
			} elseif (strpos($content, "*")) {
				$html .=  '<span class="content"> <b><font color=#9c009c>[IRC User Action]</b>' . htmlspecialchars($content) . '</font></span> ';
			} else
				$html .=  '<span class="content">' . htmlspecialchars($content) . '</span> ';
			$html .=  "<br>";

		}
$response ['html'] = $html;
		//print $html ;
		fclose($logfile);




$json = json_encode($response);

print_r( $json);


?>
