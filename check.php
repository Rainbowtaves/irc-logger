<?php
//print_r($_POST);
$channel = $_POST["channel"];
$date = $_POST["date"];
$search = $_POST['search'];
$baselink = 'logs';
$filename = "$baselink/$channel/$date.log";
//echo $filename;

function lines($filename = 'logs/#russian/2022-03-12.log')
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


echo lines($filename);

//echo get_new_string ('logs/#russian/2022-03-14.log',20);


