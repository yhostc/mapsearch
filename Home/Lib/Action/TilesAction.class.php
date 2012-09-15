<?php
/**
 +----------------------------------------------------------
 * 切片自行渲染类
 +----------------------------------------------------------
 * @param $t 搜索编号
 * @param $x
 * @param $y
 * @param $z
 +----------------------------------------------------------
 * @return PNG Image
 +----------------------------------------------------------
 */
class TilesAction extends Action{
	function _initialize() {
		//建立缓存目录
		if (!@file_exists("./Tiles/")) {
			@mkdir("./Tiles/",0777);//生成查询目录
		}
		if (@$_GET['t'] && !@file_exists("./Tiles/".$_GET['t'])) {
			@mkdir("./Tiles/".$_GET['t'],0777);//生成查询目录
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
    	//接收参数数据
    	$t = $_REQUEST['t'];
    	$x = $_REQUEST['x'];$y = $_REQUEST['y'];$z = $_REQUEST['z'];
    	//生成ZOOM级别文件夹
    	$path = "./Tiles/$t/$z";
    	if (!@file_exists($path)) {//级别
    		@mkdir($path,0777);
    	}
    	$path .= "/$x.$y";
    	$_t1 = $_t2 = $_t3 = micro_time();
    	$c = "YES";//是否缓存
    	if (!file_exists("$path.png")) {//检查该请求切片是否已经存在，如果不存在，则生产切片
    		$c = "NO";//新生产切片
    		$sw = self::pixel2lnglat($x*256-5,($y+1)*256-5,$z);//根据切片号转换为切片Bounds
	    	$ne = self::pixel2lnglat(($x+1)*256+5,$y*256+5,$z);
	    	$b = implode(",",$sw).";".implode(",",$ne);
	    	$k = D("Mass")->where("md=$t")->getField("keyword");
	    	$data = LseAction::boundsSearch($k,100,$sw,$ne);
	    	$_t2 = micro_time();
	    	$hot = self::render($data['list'], $sw, $ne, $z, "$path.png");
	    	$_t3 = micro_time();
	    	//缓存热点信息
	    	@file_put_contents("$path.json",@json_encode($hot));
    	}
    	$im = imagecreatefrompng("$path.png");
    	header('Content-type:image/png');
    	imagepng($im);
    	imagedestroy($im);
    	/******************************************************************************************/
    	$log  = "\r\n";
    	$log .= "[SQL]  ".number_format($_t2-$_t1,6,'.','')."ms    ";
    	$log .= "[TILE] ".number_format($_t3-$_t2,6,'.','')."ms catch:".$c."\r\n";
    	$log .= "[URL]  ".$file."\r\n";
		Log::write($log,"INFO",3,LOG_PATH.date('y_m_d')."_tile.log");
    }
    /**
     +----------------------------------------------------------
     * 渲染函数
     +----------------------------------------------------------
     * @param $list 城市ID
     * @param $sw 城市ID
     * @param $ne 城市ID
     * @param $z 城市ID
     * @param $file
     +----------------------------------------------------------
     * @return array json 数组
     +----------------------------------------------------------
     */
    protected function render($list, $sw, $ne, $z, $file){
    	$icon = "./images/mapslt.png";
    	list($w,$h) = getimagesize($icon);//读取图片宽高
    	//定义切片画布
    	$im  = @imagecreate(256,256)
    		or die("Cannot Initialize new GD image stream");
    	@imagealphablending($im ,false);
    	@imagesavealpha($im, true);
    	imagecolortransparent($im ,@imagecolorallocatealpha($im, 255, 255, 255, 127));
    	$icon_stream = @imagecreatefrompng($icon);//读取图标文件
    	//计算图标分布位置
    	$nw = self::lnglat2pixel($sw[0],$ne[1],$z);//切片左上角经纬度像素坐标
    	$hotspot = array();
    	foreach ($list as $k=>$v){
    		$d = self::lnglat2pixel($v['x'], $v['y'], $z);
    		$m = round($d[0] - $nw[0],2) - $w/2 - 3.5;//图标在切片上的X像素
    		$n = round($d[1] - $nw[1],2) - $h/2 + 3.5;//图标在切片上的Y像素
    		@imagecopy($im , $icon_stream, $m, $n, 0, 0, $w, $h);
    		//计算图标bounds
    		$icon_sw = self::pixel2lnglat($d[0]-$w/2, $d[1]-$h/2, $z);
    		$icon_ne = self::pixel2lnglat($d[0]+$w/2, $d[1]+$h/2, $z);
    		$hotspot[] = array(//热点信息
    			'id'=>$v['pguid'],
    			'name'=>$v['name'],
    			'position'=>array($v['x'],$v['y']),
    			'bounds'=>array($icon_sw[0], $icon_sw[1], $icon_ne[0], $icon_ne[1])
    		);
    	}
    	//header('Content-type:image/png');
    	imagepng($im,$file);
    	//销毁资源
		imagedestroy($im);
		imagedestroy($icon_stream);
		return $hotspot;
    }
    protected function lnglat2pixel($lng, $lat, $z){
    	$sin = sin($lat * pi()/180);
		$x = (($lng + 180) / 360) * 256 * pow(2,$z);
		$y = (0.5-log((1+$sin)/(1-$sin)) / (4 * pi())) * 256 * pow(2,$z);
		return array(round($x,2), round($y,2));
    }
    protected function pixel2lnglat($x, $y, $z){
    	$exp0 = exp(4*pi()*(0.5-$y/256/pow(2,$z)));
		$lng = $x/256/pow(2,$z)*360 - 180;
		$lat = asin(($exp0-1)/($exp0+1))/pi()*180;
		return array($lng, $lat);
    }
    public function hotspot(){
    	$file = $_REQUEST['file'];
    	$tile = $_REQUEST['tile'];
    	$zoom = $_REQUEST['z'];
    	$rid = $_REQUEST['rid'];
    	
    	$result = explode(",", $tile);
    	$tiles = array();
    	$list = array();

    	foreach ($result as $key => $value){
    		$content = "./Tiles/$file/$zoom/$value.json";
    		$data = json_decode(file_get_contents($content),true);
    		if ($data){
    		
    		$arr[0]['status'] = 'true';
    		$arr[0]['hotspots'] = $data;
    		for ($i=0;$i<count($arr[0]['hotspots']);$i++){
    			$arr[0]['hotspots'][$i]['pos']['lng'] = $arr[0]['hotspots'][$i]['position'][0];
    			$arr[0]['hotspots'][$i]['pos']['lat'] = $arr[0]['hotspots'][$i]['position'][1];
    			unset($arr[0]['hotspots'][$i]['position']);
    		}
    		$arr[0]['tile'] = $value;
    		$arr[0]['type'] = 'list';

    		$list = array_merge($arr,$list);
    		
    		}
    	}
    	$tiles['list'] = $list;
    	
    	echo "AMap.MAjaxResult[$rid]=".json_encode($tiles);
    }
	public function screenShot1(){
    	$wnlng = $_REQUEST['wnlng'];
    	$wnlat = $_REQUEST['wnlat'];
    	$eslng = $_REQUEST['eslng'];
    	$eslat = $_REQUEST['eslat'];
    	$z = $_REQUEST['z'];
    	$wnresult = self::lnglat2pixel($wnlng, $wnlat, $z);
    	$esresult = self::lnglat2pixel($eslng, $eslat, $z);
    	$wnx = intval($wnresult[0]/256);
    	$wny = intval($wnresult[1]/256);
    	$esx = intval($esresult[0]/256);
    	$esy = intval($esresult[1]/256);
    	$x = $wnx;
    	$y = $wny;
    	$xnum = $esx-$wnx;
    	$ynum = $esy-$wny;
    	header('Content-type:image/png');
    	$bg = @imagecreate(($xnum+1)*256,($ynum+1)*256)
    		or die("Cannot Initialize new GD image stream");
    	for ($i=0;$i<=$ynum;$i++){
    		for ($j=0;$j<=$xnum;$j++){
    			$newx = $x+$j;
    			$newy = $y+$i;
    			$url = "http://emap2.mapabc.com/mapabc/maptile?x=$newx&y=$newy&z=$z";
    			$img = imagecreatefrompng($url);
    			@imagecopy($bg,$img,($j*256),($i*256),0,0,256,256);
    		}
    	}
		
    	$png = ImageCreateTrueColor(($esresult[0]-$wnresult[0]),($esresult[1]-$wnresult[1]));
    	@imagecopyresampled($png,$bg,0,0,$wnresult[0]-$wnx*256,$wnresult[1]-$wny*256,($xnum+1)*256,($ynum+1)*256,($xnum+1)*256,($ynum+1)*256);
    	@imagepng($png);
    }
	public function wbln(){
    	$wnlng = $_REQUEST['wnlng'];
    	$wnlat = $_REQUEST['wnlat'];
    	$eslng = $_REQUEST['eslng'];
    	$eslat = $_REQUEST['eslat'];
    	$z = $_REQUEST['z'];
    	$wnresult = self::lnglat2pixel($wnlng, $wnlat, $z);
    	$esresult = self::lnglat2pixel($eslng, $eslat, $z);
    	$wnx = intval(($wnresult[0]+$_REQUEST['x'])/256);
    	$wny = intval(($wnresult[1]+$_REQUEST['y'])/256);
    	$esx = intval(($wnresult[0]+$_REQUEST['x2'])/256);
    	$esy = intval(($wnresult[1]+$_REQUEST['y2'])/256);
    	$x = $wnx;
    	$y = $wny;
    	$xnum = $esx-$wnx;
    	$ynum = $esy-$wny;

    	header('Content-type:image/png');
    	$bg = @imagecreate(($xnum+1)*256,($ynum+1)*256)
    		or die("Cannot Initialize new GD image stream");
    	for ($i=0;$i<=$ynum;$i++){
    		for ($j=0;$j<=$xnum;$j++){
    			$newx = $x+$j;
    			$newy = $y+$i;
    			$url = "http://emap2.mapabc.com/mapabc/maptile?x=$newx&y=$newy&z=$z";
    			$img = imagecreatefrompng($url);
    			@imagecopy($bg,$img,($j*256),($i*256),0,0,256,256);
    		}
    	}
		
    	$png = ImageCreateTrueColor($_REQUEST['x2']-$_REQUEST['x'],$_REQUEST['y2']-$_REQUEST['y']);
    	@imagecopyresampled($png,$bg,0,0,$wnresult[0]+$_REQUEST['x']-$wnx*256,$wnresult[1]+$_REQUEST['y']-$wny*256,($xnum+1)*256,($ynum+1)*256,($xnum+1)*256,($ynum+1)*256);
    	@imagepng($png);
    }
	public function screenShot(){
    	$wnlng = $_REQUEST['wnlng'];
    	$wnlat = $_REQUEST['wnlat'];
    	$eslng = $_REQUEST['eslng'];
    	$eslat = $_REQUEST['eslat'];
    	$z = $_REQUEST['z'];
    	$wnresult = self::lnglat2pixel($wnlng, $wnlat, $z);
    	$esresult = self::lnglat2pixel($eslng, $eslat, $z);
    	$wnx = intval(($wnresult[0]+$_REQUEST['x'])/256);
    	$wny = intval(($wnresult[1]+$_REQUEST['y'])/256);
    	$esx = intval(($wnresult[0]+$_REQUEST['x2'])/256);
    	$esy = intval(($wnresult[1]+$_REQUEST['y2'])/256);
    	$x = $wnx;
    	$y = $wny;
    	$xnum = $esx-$wnx;
    	$ynum = $esy-$wny;

    	header('Content-type:image/png');
    	header('Content-Disposition: attachment; filename="图盟地图.png"'); 
    	$bg = @imagecreate(($xnum+1)*256,($ynum+1)*256)
    		or die("Cannot Initialize new GD image stream");
    	for ($i=0;$i<=$ynum;$i++){
    		for ($j=0;$j<=$xnum;$j++){
    			$newx = $x+$j;
    			$newy = $y+$i;
    			$url = "http://emap2.mapabc.com/mapabc/maptile?x=$newx&y=$newy&z=$z";
    			$img = imagecreatefrompng($url);
    			@imagecopy($bg,$img,($j*256),($i*256),0,0,256,256);
    		}
    	}
		
    	$png = ImageCreateTrueColor($_REQUEST['x2']-$_REQUEST['x'],$_REQUEST['y2']-$_REQUEST['y']);
    	@imagecopyresampled($png,$bg,0,0,$wnresult[0]+$_REQUEST['x']-$wnx*256,$wnresult[1]+$_REQUEST['y']-$wny*256,($xnum+1)*256,($ynum+1)*256,($xnum+1)*256,($ynum+1)*256);
    	@imagepng($png);
    }
}
?>