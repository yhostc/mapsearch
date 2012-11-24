<?php
class ServerAction extends Action
{
	/**
     +----------------------------------------------------------
     * 自动提示
     +----------------------------------------------------------
     * @param $k 关键字
     +----------------------------------------------------------
     * @return json
     +----------------------------------------------------------
     */
	function autoPrompts(){
    	header("Content-Type:text/html; charset=utf-8");
    	$k = @$_REQUEST['k'];//查询关键字
    	$t = @$_REQUEST['t'];//查询类型
    	$a = self::_geocode($k,3);
    	$b = self::_poi($k,15);
    	if ($t == 'bus'){
    		$list = array_merge($b["list"],$a["list"]);
    	}else {
    		$list = array_merge($a["list"],$b["list"]);
    	}
    	$data = array();$arr = array();$i=0;
    	foreach ($list as $val){
    		if(in_array($val['name'],$arr) || $i>9){continue;}
    		$j = array();
			$j['name']	= $arr[]	= $val['name'];
			$j['x'] 				= (float)$val['x'];
			$j['y']					= (float)$val['y'];
			$data[] = $j;
			$i++;
    	}
    	echo json_encode($data);
    }
	/**
     +----------------------------------------------------------
     * POI自动提示
     +----------------------------------------------------------
     * @param $k 关键字
     +----------------------------------------------------------
     * @return json
     +----------------------------------------------------------
     */
	function autoPoi(){
    	header("Content-Type:text/html; charset=utf-8");
    	$k = @$_REQUEST['k'];//查询关键字
    	$list = self::_bus($k,15);
    	//$list = $a['list'];
    	$data = array();$arr = array();$i=0;
    	foreach ($list as $val){
    		if(in_array($val['name'],$arr) || $i>9){continue;}
    		$j = array();
			$j['name']	= $arr[]	= $val['name'];
			$j['x'] 				= (float)$val['x'];
			$j['y']					= (float)$val['y'];
			$data[] = $j;
			$i++;
    	}
    	echo json_encode($data);
    }
    /**
     +----------------------------------------------------------
     * 综合查询接口
     +----------------------------------------------------------
     * @param $c 城市
     * @param $d 分类
     * @param $k 关键字
     * @param $p 当前页码
     +----------------------------------------------------------
     * @return json
     +----------------------------------------------------------
     */
	function search(){
		header("Content-Type:text/html; charset=utf-8");
		$city = $_REQUEST['c'];//城市
		$cate = $_REQUEST['d'];//分类
		$keyword = $_REQUEST['k'];//关键字
		$page = $_REQUEST['p'];//页码
		$arr = array('status'=>1,'info'=>'数据获取成功！');
		//检查关键字是否POI分类
		$key = urlencode(mb_convert_encoding($keyword, 'gbk', 'utf-8'));
		$url = "http://172.17.41.118:8150/ip?in=$key";
		$res = file_get_contents($url);
		$result = $res{6};
		preg_match("/rs:'(.*)'}/", $res, $rs);
		$keyword = mb_convert_encoding($rs[1], 'utf-8', 'gbk');
		$keyword = strtr($keyword, ";", "|");
		
		switch ($result){
			case 0:
				break;
			case 1://行政区划
				$a = self::_district($keyword,10,$city);
				break;
			case 2://地理解析
				$a = self::_geocode($keyword,10);
				break;
			case 3://道路
				$a = self::_road($keyword,10,$city);
				break;
			case 4://周边
				$a = self::_vicinity($keyword,10,$city,$cate,$page);
				break;
			case 5://POI搜索
				$a = self::_poi($keyword,10,$city,$cate,$page);
				break; 
			case 6://公交线路
				$a = self::_bus($keyword,10,$city);
				break;
			case 7://公交线路
				$a = self::_busline($keyword,10,$city);
				break;
			default:
				break;
		}
		
		switch ($a['type']){//对结果进行整理
			case "POI":
				$a['list'] = self::_poiResult($a['list']);
				break;
			case "VICINITY":
				$a['list'] = self::_vicinityResult($a['list']);
				break;
			case "BUS":
				$a['list'] = self::_busResult($a['list']);
				break;
			case "BUSLINE":
				$a['list'] = self::_buslineResult($a['list']);
				break;
			case "ROAD":
				$a['list'] = self::_roadResult($a['list']);
				break;
			case "GEOCODE":
				$a['list'] = self::_geocodeResult($a['list']);
				break;
			case "AREA":
				$a['list'] = self::_areaResult($a['list']);
				break;
			default:
				break;
		}
		//海量查询
		if ($a['count']>100) {//获取旧的查询
            if ($md = D("Mass")->where("keyword='$keyword'")->getField('md')) {
				$a['mass'] = $md;
            }else{//新增查询
				$a['mass'] = strval(time());
				D("Mass")->data(array('keyword'=>$keyword,'md'=>$a['mass']))->add();
            }
        }
        
		if (!$a["count"]) {//输出提示整合
			$arr = array('status'=>0,'info'=>'数据获取失败！');
		}
		if($_GET['k']){
			dump($a);
		}
		echo json_encode(@array_merge($arr,$a));
	}
	function getPoiInfo(){
		$id = $_REQUEST['id'];
		$arr = LseAction::_pguid($id);
		$arr["list"] = self::_poiResult($arr['list']);
		$arr["list"] = $arr["list"][0];
		$arr["status"] = 1;
		$str = explode(';',$arr["list"]["tel"]);
		if (count($str)>2){
			$data = $str[0];
			$data .= ';';
			$data .= $str[1];
			$arr["list"]["tel"] = $data;
		}
		echo json_encode($arr);
	}
	//POI查询
    protected function _poi($k,$c=10,$city='total',$cate='',$page=1){//POI查询
    	$url  = C('LSE')."sisserver?query_type=TQUERY&data_type=POI+NEWPOI&page_num=$c&keywords=$k";
    	$url .= "&category=$cate";
    	$url .= "&page=$page";
    	$url .= "&city=$city";
    	$list = get_data_by_get($url);
    	if ($list['count'] == 0){
    		$Model = D('Partion');
    		$pid = $Model->where("name='$city'")->getField('pid');
    		$city = $Model->where("id=$pid")->getField('name');
    		$url  = C('LSE')."sisserver?query_type=TQUERY&data_type=POI+NEWPOI&page_num=$c&keywords=$k";
	    	$url .= "&category=$cate";
	    	$url .= "&page=$page";
	    	$url .= "&city=$city";
    		$list = get_data_by_get($url);
    	}
    	if ($list['count']!="" && is_array($list['list']) && is_array($list['list']["poi"])) {//返回有效结果
    		$pois = $list['count']=="1" ? array($list['list']["poi"]) : $list['list']["poi"];
	    	//array_multisort($pois,SORT_ASC,SORT_STRING);
	    	return array('count'=>(int)$list['count'],'type'=>'POI','list'=>$pois);
    	}
		return array('count'=>0,'type'=>'POI','list'=>array());
    }
    //周边POI查询
    protected function _vicinity($k,$c=10,$city='total',$cate='',$page=1){
    	$data = explode('|', $k);
    	$center = $data[0];
    	$k = $data[1];
    	$url  = C('LSE')."sisserver?query_type=RQBN&data_type=POI&page_num=$c&center=$center&keywords=$k";
    	$url .= "&category=$cate";
    	$url .= "&page=$page";
    	$url .= "&city=$city";
    	$list = get_data_by_get($url);
    	if ($list['count']!="" && is_array($list['list']) && is_array($list['list']["poi"])) {//返回有效结果
    		$pois = $list['count']=="1" ? array($list['list']["poi"]) : $list['list']["poi"];
	    	//array_multisort($pois,SORT_ASC,SORT_STRING);
	    	return array('count'=>(int)$list['count'],'type'=>'VICINITY','list'=>$pois);
    	}
		return array('count'=>0,'type'=>'POI','list'=>array());
    }
    //地址解析
    protected function _geocode($k,$c=10){//地址解析
    	$k = urlencode(mb_convert_encoding($k, 'gbk', 'utf-8'));
    	$url = C('LSE')."geocoding.cgi?query_type=GEOCODE&data_type=POI+NEWPOI&count=$c&restrict_area=&keywords=$k";
    	$list = get_data_by_get($url);
    	if ($list['count']!="" && is_array($list['list']) && is_array($list['list']["poi"])) {//返回有效结果
    		$pois = $list['count']=="1" ? array($list['list']["poi"]) : $list['list']["poi"];
	    	//array_multisort($pois,SORT_ASC,SORT_STRING);
	    	return array('count'=>(int)$list['count'],'type'=>'GEOCODE','list'=>$pois);
    	}
    	return array('count'=>0,'type'=>'GEOCODE','list'=>array());
    }
    //区县查询
    protected function _district($k,$c=10,$city){
    	$k = urlencode(mb_convert_encoding($k, 'gbk', 'utf-8'));
    	$url  = C('LSE')."sisserver?query_type=TQUERY&data_type=DISTRICT&page_num=$c&keywords=$k";
    	//$url .= "&city=$city";
    	$list = get_data_by_get($url);
    	if ($list['count']!="" && is_array($list['list']) && is_array($list['list']["district"])) {//返回有效结果
    		$pois = $list['count']=="1" ? array($list['list']["district"]) : $list['list']["district"];
	    	//array_multisort($pois,SORT_ASC,SORT_STRING);
	    	return array('count'=>(int)$list['count'],'type'=>'AREA','list'=>$pois[0]);
    	}
		return array('count'=>0,'type'=>'AREA','list'=>array());
    }
    //公交站点查询
    protected function _bus($k,$c=10,$city=''){
    	$k = urlencode(mb_convert_encoding($k, 'gbk', 'utf-8'));
    	$url  = C('LSE')."sisserver?query_type=TQUERY&data_type=BUS&page_num=$c&keywords=$k";
    	$url .= "&city=$city";
    	$list = get_data_by_get($url);
    	if ($list['count'] == 0){
    		$Model = D('Partion');
    		$pid = $Model->where("name='$city'")->getField('pid');
    		$city = $Model->where("id=$pid")->getField('name');
    		$url  = C('LSE')."sisserver?query_type=TQUERY&data_type=BUS&page_num=$c&keywords=$k";
    		$url .= "&city=$city";
    		$list = get_data_by_get($url);
    	}
    	if ($list['count']!="" && is_array($list['list']) && is_array($list['list']["poi"])) {//返回有效结果
    		$pois = $list['count']=="1" ? array($list['list']["poi"]) : $list['list']["poi"];
	    	//array_multisort($pois,SORT_ASC,SORT_STRING);
	    	return array('count'=>(int)$list['count'],'type'=>'BUS','list'=>$pois[0]);
    	}
		return array('count'=>0,'type'=>'BUS','list'=>array());
    }
    //公交线路查询
    protected function _busline($k,$c=10,$city=''){//道路查询
    	$url  = C('LSE')."sisserver?query_type=TQUERY&data_type=BUSLINE&page_num=$c&keywords=$k";
    	$url .= "&city=$city";
    	$list = get_data_by_get($url);
    	if ($list['count']!="" && is_array($list['list']) && is_array($list['list']["busline"])) {//返回有效结果
    		$pois = $list['count']=="1" ? array($list['list']["busline"]) : $list['list']["busline"];
	    	//array_multisort($pois,SORT_ASC,SORT_STRING);
	    	return array('count'=>(int)$list['count'],'type'=>'BUS','list'=>$pois);
    	}
		return array('count'=>0,'type'=>'BUS','list'=>array());
    }
    //道路查询
    protected function _road($k,$c=10,$city=''){//道路查询
    	$url  = C('LSE')."sisserver?query_type=TQUERY&data_type=ROAD&page_num=$c&keywords=$k";
    	$url .= "&city=$city";
    	$list = get_data_by_get($url);
    	if ($list['count'] == 0){
    		$Model = D('Partion');
    		$pid = $Model->where("name='$city'")->getField('pid');
    		$city = $Model->where("id=$pid")->getField('name');
    		$url  = C('LSE')."sisserver?query_type=TQUERY&data_type=ROAD&page_num=$c&keywords=$k";
    		$url .= "&city=$city";
    		$list = get_data_by_get($url);
    	}
    	if ($list['count']!="" && is_array($list['list']) && is_array($list['list']["road"])) {//返回有效结果
    		$pois = $list['count']=="1" ? array($list['list']["road"]) : $list['list']["road"];
	    	//array_multisort($pois,SORT_ASC,SORT_STRING);
	    	return array('count'=>(int)$list['count'],'type'=>'ROAD','list'=>$pois);
    	}
		return array('count'=>0,'type'=>'ROAD','list'=>array());
    }
    //行政区划查询
    protected function _area($k,$c=10,$city=''){
    	$url  = C('LSE')."sisserver?query_type=TQUERY&data_type=AREAINFO&page_num=$c&keywords=$k";
    	$url .= "&city=$city";
    	$list = get_data_by_get($url);
    	if ($list['count']!="" && is_array($list['list']) && is_array($list['list']["busline"])) {//返回有效结果
    		$pois = $list['count']=="1" ? array($list['list']["busline"]) : $list['list']["busline"];
	    	array_multisort($pois,SORT_ASC,SORT_STRING);
	    	return array('count'=>(int)$list['count'],'type'=>'AREA','list'=>$pois);
    	}
		return array('count'=>0,'type'=>'AREA','list'=>array());
    }
    //POI 结果处理
    private function _poiResult($a){
    	$b = array();
    	foreach ($a as $k=>$i){
    		$b[] = array(
    			'pguid' => $i['pguid'],
    			'name'  => $i['name'],
    			'x'		=> (float)$i['x'],
    			'y'		=>(float)$i['y'],
    			'tel'	=>	$i['tel'],
    			'address' => $i['address'],
    			'type'  => $i['type'],
    			'imageid' => $i['imageid']
    		);
    	}
    	return $b;
    }
	//POI 结果处理
    private function _vicinityResult($a){
    	$b = array();
    	foreach ($a as $k=>$i){
    		$b[] = array(
    			'pguid' => $i['pguid'],
    			'name'  => $i['name'],
    			'x'		=> (float)$i['x'],
    			'y'		=>(float)$i['y'],
    			'tel'	=>	$i['tel'],
    			'address' => $i['address'],
    			'type'  => $i['type'],
    			'imageid' => $i['imageid']
    		);
    	}
    	return $b;
    }
    //BUS 结果处理
    private function _busResult($a){
    	$b = array(
    		'pguid' => $a['pguid'],
    		'name' => $a['name'],
    		'type' => $a['type'],
    		'x' => (float)$a['x'],
    		'y' => (float)$a['y'],
    		'lines' => $a['lines']
    	);
    	//dump($b);
    	return $b;
    }
    //BUSLINE 结果处理
	private function _buslineResult($a){
		$b = array();
    	foreach ($a as $k=>$i){
    		$b[] = array(
    			'id' 			=>	$i['line_id'],
    			'name'  		=>	$i['name'],
    			'start_name'	=>	$i['front_name'],
    			'end_name'		=>	$i['terminal_name'],
    			'length'		=>	(float)$i['length'],
    			'coords'		=>	_coords($i['xys']),
    			'start_time'	=>	date("H:i",strtotime($i['start_time'])),
    			'end_time'		=> 	date("H:i",strtotime($i['end_time'])),
    			'basic_price'	=>	(float)$i['basic_price'],
    			'total_price'	=>	(float)$i['total_price'],
    			'company'		=>	$i['company'],
    			'stationdes'	=>	_stationdes($i['stationdes'])
    		);
    	}
    	return $b;
	}
	//ROAD 结果处理
    private function _roadResult($a){
    	$b = array();
    	foreach ($a as $k=>$i){
    		$b[] = array(
    			'id' 		=>	$i['id'],
    			'name'  	=>	$i['name'],
    			'coords'	=>	_coords($i['coords']),
    			'width'		=>	(float)$i['width'],
    			'roadclass'	=>	$i['roadclass'],
    			'citycode'	=> 	$i['citycode'][0]
    		);
    	}
    	return $b;
    }
    //GEOCODE 结果处理
	private function _geocodeResult($a){
		$b = array();
		foreach ($a as $k=>$i){
			$b[] = array(
	    		'name' 	=> $i['name'],
	    		'x'		=>	(float)$i['x'],
	    		'y'		=>	(float)$i['y'],
	    		'coords'	=>	_coords($i['roadpts']),
	    		'range'		=>	(float)$i['range'],
	    		'adcode'	=>	$i['adcode'],
	    		'address'	=>	$i['address'],
	    		//'address'	=>	$a['province'].$a['city'].$a['district'].$a['address'],
	    	);
		}
    	return $b[0];
	}
	//AREA 结果处理
	private function _areaResult($a){
		$adcode = $a['adcode'];
		$Model = M('Partion');
		$x = $Model->where("adcode=$adcode")->getField('x');
		$y = $Model->where("adcode=$adcode")->getField('y');
		$b = array(
			'name' => $a['name'],
			'x' => (float)$x,
			'y' => (float)$y,
			'ename' => $a['ename'],
			'adcode' => $a['adcode'],
			'citycode' => $a['citycode'][0],
			'srctype' => $a['srctype']
		);
		
		return $b;
	}
	//逆地理解析
	public function rgeocode(){
		$x = $_REQUEST['x'];
		$y = $_REQUEST['y'];
    	$url  = C('LSE')."rgeocode.cgi?query_type=RGEOCODE&x=$x&y=$y";
    	$list = get_data_by_get($url);
    	echo json_encode($list['spatialbean']['poilist']['poi']);
    }
    
    //多经纬度逆地理解析
    public function allrgeocode(){
    	$lnglat = $_REQUEST['lnglat'];
    	$xy = explode(';',$lnglat);
    	$name = array();
    	for ($i=0;$i<count($xy);$i++){
    		$ll = explode(',',$xy[$i]);
    		$url = C('LSE')."rgeocode.cgi?query_type=RGEOCODE&x=$ll[0]&y=$ll[1]";
    		$data = get_data_by_get($url);
    		$name[$i] = $data['spatialbean']['poilist']['poi']['name'];
    	}
    	
    	echo json_encode($name);
    }
    
    //分享信息保存
    public function share(){
    	$action = $_REQUEST['action'];
    	$center = $_REQUEST['center'];
    	$zoom = $_REQUEST['zoom'];
    	$page = $_REQUEST['page'];
    	$keywords = $_REQUEST['keywords'];
    	Load('extend');
    	$_REQUEST['url'] = rand_string(6,'5','');
    	
    	$Model = D('share');
    	$Model->create();
    	$result = $Model->add($_REQUEST);
    	$msg = array();
    	if ($result !== false){
    		$msg['status'] = 1;
    		$msg['url']=$_REQUEST['url'];
    	}
    	
    	echo json_encode($msg);
    }
	public function getUrl(){
		$url = $_REQUEST['url'];
		$Model = D('share');
		$result = $Model->where("url='$url'")->find();
		$msg = array();
		if ($result !== false){
			$msg['status'] = 1;
			$msg['message'] = $result;
		}
		
		echo json_encode($msg);
	}
}
?>