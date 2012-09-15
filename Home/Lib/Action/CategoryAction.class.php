<?php
class CategoryAction extends Action
{
	function getPartion($id){
		$model = D("Category");
		$a = $model->where("id=".$id)->field("id,pid,name,level")->find();
		$pa = array();
		if ($a['level']==1) {
			$pa[] = $a['name'];
		}else if ($a['level']==2) {
			$pa[] = $model->where("id=".$a['pid'])->getField("name");
			$pa[] = $a['name'];
		}else if ($a['level']==3) {
			$c = $model->where("id=".$a['pid'])->field("pid,name")->find();
			$pa[] = $model->where("id=".$c['pid'])->getField("name");
			$pa[] = $c['name'];
			$pa[] = $a['name'];
		}
		if($pa[0]!='分类'){
			array_unshift($pa,'分类');
		}
		//下级行政区划信息
		$pd = $model->where("pid=".$a['id'])->field("name")->findAll();
		return $pa;
	}
    function getChildren(){
		header("Content-Type:text/html; charset=utf-8");
		$n = urldecode(@$_REQUEST['n']);//名称
		$model = D("Category");
		$sql = $n ? "name='$n'" : "pid=0";
		$a = $model->where($sql)->field("id,pid,name")->find();
		$arr = array('status'=>1,'info'=>'数据获取成功！');
		$arr['data'] = $model->where("pid=".$a['id'])->field("name")->findAll();
		$arr['partion'] = self::getPartion($a['id']);
		if($_GET['n']){
    		dump($arr);
    	}
		echo json_encode($arr);
	}

}
?>