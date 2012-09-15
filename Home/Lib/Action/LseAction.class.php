<?php
class LseAction extends Action
{
    /**
     +----------------------------------------------------------
     * 逆地理解析
     +----------------------------------------------------------
     * @param $k 区县名称
     +----------------------------------------------------------
     * @return json
     +----------------------------------------------------------
     */
    public function rgeocode($x,$y,$c=10){
    	$url  = C('LSE')."rgeocode.cgi?query_type=RGEOCODE&x=$x&y=$y";
    	$list = get_data_by_get($url);
    	$arr = array('count'=>0);
    	//dump($list);
    	if ($list['spatialbean']["province"]!="") {//返回有效结果
    		
	    	$arr = array('count'=>(int)$list['count'],'type'=>'RGEOCODE','list'=>$pois);
    	}
    	return $arr;
    }
    //公交ID查询
    function _bus($k='110100012424'){
    	$url  = C('LSE')."sisserver?query_type=IDQ&data_type=BUSLINE&keywords=$k";
    	$list = get_data_by_get($url);
    	if ($list['count']!="" && is_array($list['list']) && is_array($list['list']["busline"])) {//返回有效结果
    		$pois = $list['count']=="1" ? array($list['list']["busline"]) : $list['list']["busline"];
	    	array_multisort($pois,SORT_ASC,SORT_STRING);
	    	return array('count'=>(int)$list['count'],'type'=>'BUSID','list'=>$pois);
    	}
		return array('count'=>0,'type'=>'AREA','list'=>array());
    }
	
    /**
     +----------------------------------------------------------
     * PGUID查询
     +----------------------------------------------------------
     * @param $k 区县名称
     +----------------------------------------------------------
     * @return json
     +----------------------------------------------------------
     */
    function _pguid($id){
    	header("Content-Type:text/html; charset=utf-8");
    	$url  = C('LSE')."sisserver?query_type=IDQ&data_type=POI+NEWPOI+BUS&city=total&id=$id";
    	$list = get_data_by_get($url);
    	if ($list['count']!="" && is_array($list['list']) && is_array($list['list']["poi"])) {//返回有效结果
	    	return array('count'=>(int)$list['count'],'list'=>array($list['list']["poi"]));
    	}
		return array('count'=>0,'list'=>array());
    }
    /**
     +----------------------------------------------------------
     * BOUNDS SEARCH
     +----------------------------------------------------------
     * @param 
     +----------------------------------------------------------
     * @return json
     +----------------------------------------------------------
     */
    function boundsSearch($k='酒店',$c=10,$sw,$ne){
    	header("Content-Type:text/html; charset=utf-8");
    	$b = join(",",$sw).";".join(",",$ne);//"116.279296875,39.943436461974;116.3232421875,39.97712009844";
    	$url  = C('LSE')."sisserver?query_type=SPQ&geotype=rectangle&sstype=0&geoobj=$b&data_type=POI+NEWPOI&page_num=$c&keywords=".$k;
    	$list = get_data_by_get($url);
    	if ($list['count']!="" && is_array($list['list']) && is_array($list['list']["poi"])) {//返回有效结果
    		$pois = $list['count']=="1" ? array($list['list']["poi"]) : $list['list']["poi"];
	    	return array('count'=>(int)$list['count'],'type'=>'POI','list'=>$pois);
    	}
		return array('count'=>0,'type'=>'POI','list'=>array());
    	
    }

}
?>