<!DOCTYPE html>
<html>
    <head>
        <title>DombraJS - by WisdomSky</title>
        <script type="text/javascript" src="jquery.js"></script>
        <script type="text/javascript" src="umbra.jquery.js"></script>
        <script type="text/javascript">
            $(function () {

                $(document).umbra({
                    tag: {
                        wisdomsky: "external-template.html",
                        umbra: function(){
                            var $div = $("<div>");

                            $div.html("-"+$(this).html()+"-");
                            $div.css({
                                color: "red"
                            });
                            return $div;
                        }
                    }
                });


            });
        </script>
    </head>
    <body>

        <wisdomsky>hello</wisdomsky>
        <wisdomsky>lola</wisdomsky>
        <dombra>dsfdsf</dombra>
        <umbra>
            sdfdsfds
            <br>
            <wisdomsky>lola</wisdomsky>
        </umbra>

    </body>
</html>