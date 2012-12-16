<?php
//行政区划类数据查询
class PartionAction extends Action
{
	function index(){
		header("Content-Type:text/html; charset=utf-8");
		$x = $_REQUEST['x'];
		$y = $_REQUEST['y'];
		$l = $_REQUEST['l'];
		$url  = C('LSE')."rgeocode.cgi?query_type=RGEOCODE&x=$x&y=$y";
    	$list = get_data_by_get($url);
    	$list = $list['spatialbean'];
    	if (trim($list['district']['code']) && $l>=13) {//区
    		$adcode = $list['district']['code'];
    	}else if(trim($list['city']['code']) && $l>=10){//市
    		$adcode = $list['city']['code'];
    	}else if(trim($list['province']['code']) && $l>=7){//省  		
    		$adcode = $list['province']['code'];
    	}
    	echo json_encode(self::getPartion($adcode));
	}
	function getPartion($adcode,$name){
		$sql = "";
		$model = D("Partion");
		if ($adcode) {
			$sql = "adcode='$adcode'";
		}elseif ($name){
			$sql = "name='$name'";
		}
		$a = $model->where($sql)->field("id,name,pid,pcd,x,y")->find();
		$pa = array();
		if ($a['pcd']=="P") {
			$pa[] = $a['name'];
		}else if ($a['pcd']=="C") {
			$pa[] = $model->where("id=".$a['pid'])->getField("name");
			$pa[] = $a['name'];
		}else if ($a['pcd']=="D") {
			$c = $model->where("id=".$a['pid'])->field("pid,name")->find();
			$pa[] = $model->where("id=".$c['pid'])->getField("name");
			$pa[] = $c['name'];
			$pa[] = $a['name'];
		}
		if($pa[0]!='中国'){
			array_unshift($pa,'中国');
		}
		//下级行政区划信息
		$pd = $model->where("pid=".$a['id'])->field("name")->findAll();
		return $pa;
	}
	function getChildren(){
		header("Content-Type:text/html; charset=utf-8");
		$n = $_REQUEST['n'];//名称
		$model = D("Partion");
		$a = $model->where("name='$n'")->field("id,pid,name,adcode,x,y")->find();
		$arr = array('status'=>1,'info'=>'数据获取成功！');
		$arr['data'] = $model->where("pid=".$a['id'])->field("name")->findAll();
		$arr['partion'] = self::getPartion($a['adcode']);
		if($_GET['n']){
    		dump($arr);
    	}
		echo json_encode($arr);
	}
	
	//位置定位
	function getLocation(){
		header("Content-Type:text/html; charset=utf-8");
		import ( '@.ORG.IpLocation' );
		$iplocation = new IpLocation ('QQWry.Dat');
		$location = $iplocation->getlocation (self::get_client_ip());
		
		dump($location);
	}
	protected function get_client_ip() {
		if (getenv ( "HTTP_CLIENT_IP" ) && strcasecmp ( getenv ( "HTTP_CLIENT_IP" ), "unknown" ))
			$ip = getenv ( "HTTP_CLIENT_IP" );
		else if (getenv ( "HTTP_X_FORWARDED_FOR" ) && strcasecmp ( getenv ( "HTTP_X_FORWARDED_FOR" ), "unknown" ))
			$ip = getenv ( "HTTP_X_FORWARDED_FOR" );
		else if (getenv ( "REMOTE_ADDR" ) && strcasecmp ( getenv ( "REMOTE_ADDR" ), "unknown" ))
			$ip = getenv ( "REMOTE_ADDR" );
		else if (isset ( $_SERVER ['REMOTE_ADDR'] ) && $_SERVER ['REMOTE_ADDR'] && strcasecmp ( $_SERVER ['REMOTE_ADDR'], "unknown" ))
			$ip = $_SERVER ['REMOTE_ADDR'];
		else
			$ip = "unknown";
		return ($ip);
	}
	
	function citylist(){
		header("Content-Type:text/html; charset=utf-8");
		$model = D("Partion");
		$list = $model->where("pcd =  'C' or pcd='P'")->field("id,name,pcd,sw_x,sw_y,ne_x,ne_y")->order("pcd asc,id asc")->select();
		$data = array();
		$citys = array();
		$replace = array("市","省","朝鲜族自治","地区","盟","自治区","特别行政区","自治州","维吾尔","回族","哈萨克","自治州","白族","苗族自治县","土家族苗族","黎族自治县","黎族");
		foreach($list as $item){
			
			
			$name = $item['name'];
			/*
			for($i=0;$i<count($replace);$i++){
				$name = str_ireplace($replace[$i], "",$name);
			}
			$citys[] = $name;
			*/
			
			$data[] = "'".$name."':[".round($item['sw_x'], 6).",".round($item['sw_y'], 6).",".round($item['ne_x'], 6).",".round($item['ne_y'], 6)."]";
			
		}
		//dump($data);
		echo "{".implode($data,",")."}";
		 
		//echo implode($citys, ",");
	}
}
?>