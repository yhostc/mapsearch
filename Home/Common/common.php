<?php


//通过POST方式获取服务器数据
function get_data_by_post($url,$data){
	//$data = @iconv("UTF-8","GBK",$data);
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch, CURLOPT_HEADER, 0);
	curl_setopt($ch, CURLOPT_URL,$url);
	curl_setopt($ch, CURLOPT_COOKIEJAR, 'cookie.txt');
	curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	$result = curl_exec($ch);
	return $result;
}
function post_by_fsock($url,$data){
	$fp = fsockopen("172.17.41.241", 80);
	$header = "POST /mr.py HTTP/1.1\r\n";
	$header .= "Host:172.17.41.241 \r\n";
	$header .= "Content-Type: application/x-www-form-urlencoded\r\n";
	$header .= "Content-Length: ".strlen($data)."\r\n";
	$header .= "Connection: Close\r\n\r\n";
	//添加post的字符串
	$header .= $data."\r\n";
	//发送post的数据
	fputs($fp,$header);
	//发送post的数据
	$inheader = 1; $result = "";
	while (!feof($fp)) {
	    $line = fgets($fp,1024); //去除请求包的头只显示页面的返回数据
	    if ($inheader && ($line == "\n" || $line == "\r\n")){
	        $inheader = 0;
	    }
	    if ($inheader == 0) {
	       $result .= $line;
	    }
	}
	fclose($fp);
	return $result;
}
//通过GET方式获取服务器数据
function get_data_by_get($param){
	global $config;
	$url = $config['LSE'].$param;
	$url = @iconv("UTF-8","GBK",$url);
	$xml = file_get_contents($url);
	//$xml = @iconv("GBK","UTF-8",$xml);
	$xml = str_ireplace("<![CDATA[","",$xml);
	$xml = str_ireplace("]]>","",$xml);
	$xml = str_ireplace("&"," ",$xml);//文中有此符号会导致转换失败
	$data = xml_to_array($xml);
	return $data;
}
//将XML转ARRAY
function xml_to_array($xml){
	$array = (simplexml_load_string($xml));
	if($array){
		$array = (array)$array;
		foreach ($array as $key=>$item){
			$array[$key] = struct_to_array((array)$item);
			if(@is_string(@$array[$key][0])){
				$array[$key] = @$array[$key][0];
			}
		}
		return $array;
	}
	return array();
}
function struct_to_array($item){
  if(!is_string($item)) {
	$item = (array)$item;
	foreach ($item as $key=>$val){
		$item[$key] = struct_to_array($val);
		if (empty($item[$key])) {
			$item[$key] = "";
		}
	}
  }
  return $item;
}

//格式化经纬度
function formatLngLat($coords){
	$arr = array();
	$lnglats = explode(";",$coords);
	for ($i=0;$i<=count($lnglats)-1;$i++){
		$arr[] = array((float)$lnglats[$i],(float)$lnglats[$i+1]);
		$i++;
	}
	return $arr;
}
function formatTel($tel){
	$tel = explode(";",$tel);
	return join(";",array_slice($tel,0,2));
}
function formatType($type){
	$type = explode(";",$type);
	return join(";",array_unique($type));
}



//生成微秒数
function micro_time(){
	list($usec, $sec) = explode(" ", microtime());
	$num = substr($sec,5,5)+$usec;
    return ($num);
}
//道路坐标集处理
function _coords($c){
	$c = str_ireplace(";",",",$c);
	//$c = explode("#",$c);
	//$c = $c[count($c)-1];
	$c = str_ireplace("#",",",$c);
	$c = explode(",",$c);
	$d = array();
	for ($i=0;$i<count($c)-1;$i++){
		$d[] = $c[$i].",".$c[$i+1];
		$i++;
	}
	return $d;
}
//公交站点处理
function _stationdes($s){
	//echo $s;
	$s = str_ireplace("[ quot;","[",$s);
	$s = str_ireplace(" quot;]","]",$s);
	$s = str_ireplace(" lt;","<",$s);
	$s = str_ireplace(" gt;",">",$s);
	$s = str_ireplace(" quot;",'"',$s);
	$s = str_ireplace("<![CDATA[","",$s);
	$s = str_ireplace("]]>","",$s);
	$s = str_ireplace('""','',$s);
	$m = xml_to_array($s);
	$n = array();
	foreach ($m['STATION'] as $i){
		$xy = explode(";",$i['DATA'][1]);
		$n[] = array(
			'name'	=>	$i['DATA'][0],
			'x'		=>	(float)$xy[0],
			'y'		=>	(float)$xy[1],
			//'STATION_NUM'	=>	(int)$i['DATA'][4]
		);
	}
	return $n;
}
?>