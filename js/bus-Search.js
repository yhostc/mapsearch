// JavaScript Document
searchCate.bus = function(){
	var a = [];
	a.push("<div class=\"bus-widget\">");
	a.push("<div class=\"widget-place\">");
	a.push("<div class=\"widget movable\"><span class=\"widget-header\">A</span><input type=\"text\" name=\"bus\" value=\"\" /></div>");
	a.push("<div class=\"widget movable\"><span class=\"widget-header\">B</span><input type=\"text\" name=\"bus\" value=\"\" /></div>");
	a.push("</div>");
	a.push("<a class=\"widget-return kd-button\"><img src=\"images/blank.gif\"></a>");
	a.push("<div class=\"bus-button\"><input type=\"button\" value=\"查询公交\" style=\"margin-left:20px;\"></div>");
	a.push("</div>");
	a.push("<div class=\"line\"></div>");
	a.push("<div class=\"bus-result\"></div>");
	$(".ct-bus").html(a.join(""));
	
	this.init();
};
searchCate.bus.prototype = {
	init:function(){
		//加载拖拽插件
		$.getScript("js/jquery.easywidgets.min.js",function(){
			$.fn.EasyWidgets({
				callbacks:{
					onChangePositions:function(){
						$(".widget-place").find('.widget-header').each(function(i){
							$(this).text(String.fromCharCode(65+i));
						});
					}
				}
			});
		});
		$(".widget-place").find(":input").keydown(function(e) {
			if(e.keyCode == 13){
				var is = 0;
				$(".widget-place").find(":input").each(function(i){
					if($(this).val() == ''){
						is = 1;
						$(this).focus();
						return false;
					}
				});
				if(is == 0){
					$(".bus-button").click();
				}
			}
		});
		$(".widget-return").click(function(e) {
			var exchange = '';
            $(".widget-place").find(":input").each(function(i) {
                if(i == 0){
					exchange = $(this).val();
					$(this).val($(".widget-place").find(":input:eq(1)").val());
				}
				if(i == 1){
					$(this).val(exchange);
				}
            });
        });
		//自动完成
		var ele = this;
		$("input[name=bus]").autoPrompts({//起点
			source: "c.php/Server/autoPrompts",
			minLength: 2,
		});
		
		var self = this;
		$(".bus-button").click(function(){
			self.j = 0;
			self.bus = [];
			self.keyword();
		});
	},
	//循环进行关键字查询处理
	j:0,//关键字查询指针
	bus:[],//查询条件数组
	keyword:function(){
		searchType = "bus";
		var k = $("input[name=bus]"),self=this;
		if(this.j<k.length){//查询下一个关键字
			if(this.bus[this.j]){//若此项已存在，则跳过
				this.j++;
				this.keyword();
			}else{
				this.poiSearch(k.eq(this.j).val());
			}
		}else{//已完成关键字匹配操作，进入路线查询
			$.getScript("js/DragBus.js",function(e){
				bus = new DragBus(map,self.bus);
				bus.search();
			});
		}
	},
	//POI查询，进行定位
	poiSearch:function(k){
		var temp=[],self=this;
		$.ajax({type:"POST",dataType:"json",data:{k:k,t:'bus'},url:"c.php/Server/autoPrompts",
			success:function(data){
				if(data.length==0){//错误处理
					temp.push("<p style=\"padding:0 20px;\"><span class=\"widget-header\">");
					temp.push(String.fromCharCode(65+self.j)+"</span> 未查到有效信息，请换个表达方式试试！");
					temp.push("</p>");
					$(".bus-result").html(temp.join(""));
					return void(0);
				}
				//记录此位置，并进行下一个关键字查询
				self.bus[self.j] = new AMap.LngLat(data[0].x,data[0].y);
				self.bus[self.j].name = data[0].name;
				self.j++;
				self.keyword();
			}
		});
	}
};
//searchCate.bus = busSearch;