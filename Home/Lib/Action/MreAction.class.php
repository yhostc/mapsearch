<?php
class MreAction extends Action
{
	function _initialize() {
		//建立缓存目录
		if (!@file_exists("./Mre/")) {
			@mkdir("./Mre/",0777);//生成查询目录
		}
		if (@$_GET['t'] && !@file_exists("./Mre/".$_GET['t'])) {
			@mkdir("./Mre/".$_GET['t'],0777);//生成查询目录
		}
	}
    /**
     +----------------------------------------------------------
     * 获取切片接口
     +----------------------------------------------------------
     * @param $t 搜索编号
     * @param $x
     * @param $y
     * @param $z
     +----------------------------------------------------------
     * @return PNG Image
     +----------------------------------------------------------
     */
    public function index(){
    	header("Content-Type:text/html; charset=utf-8");
		//接收参数数据
		$t = $_REQUEST['t'];
		$x = $_REQUEST['x'];$y = $_REQUEST['y'];$z = $_REQUEST['z'];
       
        //计算当前视野级别，此切片经纬度bounds
		$ws = self::pixel2LngLat(256*$x-5,256*($y+1)-5,$z);//西南像素坐标
		$ne = self::pixel2LngLat(256*($x+1)+5,256*$y+5,$z);//东北像素坐标
		
		$t1 = micro_time();
		
		//查询此bounds内的数据
		$k = D("Mass")->where("md=$t")->getField("keyword");
		$list = LseAction::boundsSearch($k,100,$ws,$ne);
		if ($list["count"]) {
			//组合渲染请求
			$mapdata = '<Data>';
			$names = array();
			foreach ($list['list'] as $i){
				$names[$i['pguid']] = $i['name'];//缓存名称
				$mapdata .= "<Point>
					<id>".$i['pguid']."</id>
					<name>".$i['name']."</name>
					<x>".$i['x']."</x>
					<y>".$i['y']."</y>
				</Point>";
			}
			$mapdata .= "</Data>";
			//发送请求，获取数据
			$param = "x=$x&y=$y&z=$z&mapdata=".$mapdata;
			$t2 = micro_time();
			$content = get_data_by_post(C("MRE"),$param);
			$stream = explode("$$",$content);
			$hotspot = @xml_to_array(trim($stream[1]));
			if ($hotspot['datas'] && count($hotspot['datas']['data'])>0) {
				$arr = array();
				foreach ($hotspot['datas']['data'] as $i) {
					$hot = array();
					$hot['id'] = str_replace("_p","",$i['id']);//热点ID				
					$hot['name'] = $names[$hot['id']];//热点名称
					$hot['position'] = self::getHotPosition(explode(",",$i['bbox']), $x, $y, $z);//热点基点位置
					$hot['bounds'] = self::getHotBounds(explode(",",$i['bbox']), $x, $y, $z);//整个热点经纬度bounds
					$arr[] = $hot;
				}
				//缓存热点信息
				$path = "./Mre/$t/$z";
		    	if (!@file_exists($path)) {//级别
		    		@mkdir($path,0777);
		    	}
		    	@file_put_contents("$path/$x"."_"."$y.json",@json_encode($arr));
			}
			header("Content-type: image/png");
			echo base64_decode($stream[0]);
			$log  = "[TILE]:x=$x&y=$y&z=$z ";
			$log .= "[SEARCH]:".($t2-$t1)."ms ";
			$log .= "[IMAGE]:".(micro_time()-$t2)."ms ";
			Log::write($log,"INFO",3,LOG_PATH.date('y_m_d')."_mre.log");
		}else{//返回空白PNG图
			echo file_get_contents("./nothing.png");
		}
    }
    //行政区划取图
    function adjective(){
		$x = $_GET['x'];
		$y = $_GET['y'];
		$z = $_GET['z'];
    	$code = $_GET['code'];
    	$url = C('XZH')."gettile.py?userId=101&z=$z&x=$x&y=$y&areacode=$code&areacolor=FF9999&areaoutlinecolor=FF00FF";
    	header("Content-type: image/png");
    	echo file_get_contents($url);
    }
    // 返回热点基点
    protected function getHotPosition($box,$x,$y,$z){
		$xy = self::pixel2lnglat($x*256+($box[0]+$box[2])/2,$y*256+($box[1]+$box[3])/2,$z);//切片像素转经纬度
		return $xy;
	}
    //返回热点BOUDNS
	protected function getHotBounds($box,$x,$y,$z){
		$sw = self::pixel2lnglat($x*256+$box[0],$y*256+$box[3],$z);//切片像素转经纬度
		$ne = self::pixel2lnglat($x*256+$box[2],$y*256+$box[1],$z);
		return array($sw[0],$sw[1],$ne[0],$ne[1]);
	}
	// 返回热点图标
	protected function getHotIcon($box,$x,$y,$z){
		return array('px'=>0,'py'=>0,'width'=>($box[2]-$box[0]),'height'=>($box[3]-$box[1]));
		//array('px'=>5,'py'=>8,'width'=>12,'height'=>12
	}
	/**
	 +----------------------------------------------------------
	 * 经纬度转地理像素坐标
	 +----------------------------------------------------------
	 * @param  lnglat 经纬度
	 * @param  level 缩放级别
	 * @return object 地理像素坐标
	 +----------------------------------------------------------
	 */
	function lnglat2pixel($lng,$lat,$level){
		$sinL = sin($lat * PI/180);
		$x = (($lng + 180) / 360) * 256 * pow(2,$level);
		$y = (0.5-log((1+$sinL)/(1-$sinL)) / (4 * PI)) * 256 * pow(2,$level);
		return array(round($x*100)/100,round($y*100)/100);
	}
	/**
	 +----------------------------------------------------------
	 * 地理像素坐标转经纬度 
	 +----------------------------------------------------------
	 * @param  pixel 地理像素坐标
	 * @param  level 缩放级别
	 * @return object 经纬度坐标
	 +----------------------------------------------------------
	 */
	function pixel2lnglat($x,$y,$z){
		$exp0 = exp(4*pi()*(0.5-$y/256/pow(2,$z)));
		$lng = $x/256/pow(2,$z)*360 - 180;
		$lat = asin(($exp0-1)/($exp0+1))/pi()*180;
		return array($lng, $lat);
	}
	function distanceByLnglat($lng1,$lat1,$lng2,$lat2){
		$radLat1 = self::Rad($lat1);
		$radLat2 = self::Rad($lat2);
		$a = $radLat1 -$radLat2;
		$b = self::Rad($lng1) - self::Rad($lng2);
		$s = 2 * asin(sqrt(pow(sin($a/2),2) + cos($radLat1)*cos($radLat2) * pow(sin($b/2),2)));
		$s = $s * 6378137.0;// 取WGS84标准参考椭球中的地球长半径(单位:m)
		$s = round($s * 10000) / 10000;//返回前五位有效数字
		return $s;
		//下面为两点间空间距离（非球面体）
		// var value= Math.pow(Math.pow($lng1-$lng2,2)+Math.pow($lat1-$lat2,2),1/2);
		// alert(value);
	}
	function Rad($d) {
		return $d * pi()/180.0;
	}
    
}
?>