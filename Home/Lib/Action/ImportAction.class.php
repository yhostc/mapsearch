<?php
//数据导入类
class ImportAction extends Action
{
    
    public function index(){
        header("Content-Type:text/html; charset=utf-8");
		$arr = self::excelToArray("./spec.xlsx");
		
		$data = array();
		$lastFont = '';
		
		for($i=1;$i<count($arr);$i++){
			$val = $arr[$i];
			$lastFont = $arr[$i][4] ? $arr[$i][4] :  $lastFont;
			
			dump(array(
				'name'=>	$arr[$i][0],
				'code'=>	(string)$arr[$i][1],
				'priority'=>$arr[$i][2],
				'zoom'=>	$arr[$i][3],
				//'icon'=>	$arr[$i][4],
				'font'=>	$lastFont
			));
		}
		
		
		dump($data);
    }
	protected function excelToArray($file){
		require(LIB_PATH.'ORG/PHPExcel.php');
		require(LIB_PATH.'ORG/PHPExcel/IOFactory.php');
		//获得扩展名
		$filetype = explode(".",$file);
		switch (strtolower($filetype[count($filetype)-1])){
			case "csv":
				$type = "CSV";
				break;
			case "xlsx":
				$type = "Excel2007";
				break;
			case "xls":
				$type = "Excel5";
				break;
		}
		$objReader = PHPExcel_IOFactory::createReader($type);
		//$objReader->setReadDataOnly(true);
		$objPHPExcel = $objReader->load($file);
		$objWorksheet = $objPHPExcel->getActiveSheet();
		$highestRow = $objWorksheet->getHighestRow(); 
		$highestColumn = $objWorksheet->getHighestColumn(); 
		$highestColumnIndex = PHPExcel_Cell::columnIndexFromString($highestColumn);
		$excelData = array();
		for ($row=1;$row<=$highestRow;++$row) {
			for ($col=0; $col <= $highestColumnIndex; ++$col) {
				$excelData[$row-1][] = $objWorksheet->getCellByColumnAndRow($col, $row)->getValue();
			}
		}
		return $excelData;
	}
}
?>