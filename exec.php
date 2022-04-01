<?php

final class FileReader
{
    protected $handler = null;
    protected $fbuffer = array();

    /**
     * Конструктор класса, открывающий файл для работы
     *
     * @param string $filename
     */
    public function __construct($filename)
    {
        if(!($this->handler = fopen($filename, "rb")))
            throw new Exception("Cannot open the file");
    }

    /**
     * Построчное чтение $count_line строк файла с учетом сдвига
     *
     * @param int  $count_line
     *
     * @return string
     */
    public function Read($count_line = 10)
    {
        if(!$this->handler)
            throw new Exception("Invalid file pointer");

        while(!feof($this->handler))
        {
            $this->fbuffer[] = fgets($this->handler);
            $count_line--;
            if($count_line == 0) break;
        }

        return $this->fbuffer;
    }


    /**
     * Установить строку, с которой производить чтение файла
     *
     * @param int  $line
     */
    public function SetOffset($line = 0)
    {
        if(!$this->handler)
            throw new Exception("Invalid file pointer");

        while(!feof($this->handler) && $line--) {
            fgets($this->handler);
        }
    }

    public function count($filename = 'logs/#russian/2022-03-12.log')
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
        //return $lines;
    }
    public function stringParser($count_line = 10)
    {
        $list = $this->Read ($count_line);
        $search ='';
        $html = '';
        $regex_nick = '/\<[ \+\@][^\>]+\>/';
        $regex_timestamp = '/^[0-9]{2}:[0-9]{2}/';
        $regex_govnocode = "/^[0-9]{1}:[0-9]{2}:[0-9]{2}/";
        foreach ($list as $line){
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
        return $html;
        }


};




// Пример использования

$channel = $_POST["channel"];
$date = $_POST["date"];
$search = $_POST['search'];
$old_string_number = $_POST['old_string_number'];
$response = array();
$baselink = 'logs';
$filename = "$baselink/$channel/$date.log";

$file = "file.txt";
$line = 1000000;


$stream = new FileReader($filename);

$count_line = $stream->count ($filename);

// Укажем, что читать надо с $line строки
$stream->SetOffset($old_string_number);

// Получаем содержимое $count_line строк
$result = $stream->stringParser($count_line);

//print_r("<pre>");
//print_r($result);
//print_r("</pre>");
$response ['lenght'] = $count_line;
$response['html'] = $result;

$json = json_encode($response);
print_r( $json);
