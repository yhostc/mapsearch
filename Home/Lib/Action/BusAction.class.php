<?php
class BusAction extends Action
{
    
    public function index(){
    	header("Content-Type:text/html; charset=utf-8");
    	//公交查询
    	$url = "http://172.17.41.117:8110/route?X1=116.3&Y1=39.8&X2=116.4&Y2=39.9&Type=0&City=010";
    	$bus = file_get_contents($url);
    	import("ORG.Bytes");
    	
    	$b = new Bytes();
    	$c = $b->toStr($bus);
    	dump($c);
    	
    }
    public function pack_str($str, $len) {        
        $out_str = ""; 
        for($i=0; $i<$len; $i++) { 
            $out_str .= pack("c", ord(substr($str, $i, 1))); 
        } 
        return $out_str; 
    }
}
?>